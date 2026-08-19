export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "income" | "expense" | "both";
};

export type PaymentMethod = {
  id: string;
  name: string;
  icon: string | null;
};

export type Transaction = {
  id: string;
  date: string;
  type: TransactionType;
  category_id: string | null;
  description: string;
  amount_krw: number | string;
  payment_method_id: string | null;
  note: string | null;
  categories?: Pick<Category, "name" | "icon" | "color"> | null;
  payment_methods?: Pick<PaymentMethod, "name" | "icon"> | null;
};

export type TransactionInput = {
  date: string;
  type: TransactionType;
  category_id: string | null;
  description: string;
  amount_krw: number;
  payment_method_id: string | null;
  note: string | null;
};

export type Budget = {
  category_id: string;
  amount_krw: number | string;
  categories?: Pick<Category, "name" | "icon" | "color"> | null;
};
