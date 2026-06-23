import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type BankAccountRow = Database["public"]["Tables"]["bank_accounts"]["Row"];

export type BankAccount = {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string | null;
};

const DEMO_ACCOUNT: BankAccount = {
  id: "demo-bank-account",
  name: "Wasil Main Account",
  bankName: "Yemen National Bank",
  accountNumber: "000000000000",
  accountHolder: "Wasil Yemen Connect",
  branch: "Main Branch",
};

function mapAccount(row: BankAccountRow): BankAccount {
  return {
    id: row.id,
    name: row.name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolder: row.account_holder,
    branch: row.branch,
  };
}

export function useBankAccount() {
  const [data, setData] = useState<BankAccount>(DEMO_ACCOUNT);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: rows, error: supaError } = await supabase
          .from("bank_accounts")
          .select("*")
          .eq("for_receipts", true)
          .order("is_default", { ascending: false })
          .limit(1);

        if (cancelled) return;

        if (supaError) {
          setError(supaError);
          return;
        }

        const defaultRow = rows?.[0];
        if (defaultRow) {
          setData(mapAccount(defaultRow as BankAccountRow));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
