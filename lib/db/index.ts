import "server-only";
import { Pool, type PoolClient } from "pg";
import { SUPABASE_ROOT_CA } from "./supabase-ca";

// Server-only Postgres client for the Supabase `money-flow` database, where
// Luyra's tables live in their own `luyra` schema. DATABASE_URL must never be
// exposed to the browser (no NEXT_PUBLIC_ prefix) — importing "server-only"
// makes any accidental Client Component import fail at build time instead of
// leaking the URL.
//
// DATABASE_URL connects as the dedicated `luyra_app` role through Supavisor's
// transaction pooler (port 6543). That role's default search_path is `luyra`,
// so queries use bare table names, and it has no access to money-flow's own
// `public` tables. Leave `sslmode` out of the URL: a `sslmode` parameter
// overrides the `ssl` option below and drops the Supabase CA.
//
// `sql` keeps the call shapes the repositories were written against (they
// came from @neondatabase/serverless): a tagged template, `sql.query(text,
// params)`, `sql.unsafe(fragment)` and `sql.transaction([...queries])`.
// Queries are lazy — nothing runs until awaited — which is what lets
// `sql.transaction` collect them first and run them on one connection.
//
// The pool is created on first query, not at import: `next build` imports
// every route module, and a missing DATABASE_URL should only fail a real
// request.

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

class UnsafeFragment {
  constructor(readonly text: string) {}
}

export class PendingQuery implements PromiseLike<Row[]> {
  constructor(
    readonly text: string,
    readonly values: unknown[]
  ) {}

  run(client: Pool | PoolClient): Promise<Row[]> {
    return client.query(this.text, this.values).then((result) => result.rows);
  }

  then<TResult1 = Row[], TResult2 = never>(
    onfulfilled?: ((rows: Row[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.run(getPool()).then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ): Promise<Row[] | TResult> {
    return this.then(undefined, onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<Row[]> {
    return this.run(getPool()).finally(onfinally);
  }
}

let pool: Pool | undefined;

function getPool(): Pool {
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { ca: SUPABASE_ROOT_CA },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  }));
}

function template(strings: TemplateStringsArray, ...params: unknown[]): PendingQuery {
  let text = strings[0];
  const values: unknown[] = [];
  params.forEach((param, i) => {
    if (param instanceof UnsafeFragment) {
      text += param.text;
    } else {
      values.push(param);
      text += `$${values.length}`;
    }
    text += strings[i + 1];
  });
  return new PendingQuery(text, values);
}

async function transaction(
  queries: PendingQuery[] | ((tx: typeof sql) => PendingQuery[])
): Promise<Row[][]> {
  const list = typeof queries === "function" ? queries(sql) : queries;
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const results: Row[][] = [];
    for (const query of list) results.push(await query.run(client));
    await client.query("commit");
    return results;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export const sql = Object.assign(template, {
  /** Parameterised query with `$1`-style placeholders. */
  query: (text: string, params: unknown[] = []) => new PendingQuery(text, params),
  /** Splice trusted SQL (column lists, never user input) into a tagged template. */
  unsafe: (text: string) => new UnsafeFragment(text),
  /** Run the queries in order on one connection, inside BEGIN/COMMIT. */
  transaction,
});
