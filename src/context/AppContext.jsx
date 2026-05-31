import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/index.js";
import { useAuth } from "./AuthContext.jsx";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [ledgers, setLedgers] = useState({});
  const [budgetTrees, setBudgetTrees] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    Promise.all([api.listCompanies(), api.listAmendments()])
      .then(([cs, as]) => { setCompanies(cs); setAmendments(as); })
      .finally(() => setLoading(false));
  }, [user]);

  const refreshCompanies = useCallback(async () => {
    const cs = await api.listCompanies();
    setCompanies(cs);
  }, []);

  // --- 원장 ---
  const loadLedger = useCallback(async (companyId) => {
    const rows = await api.getLedger(companyId);
    setLedgers((prev) => ({ ...prev, [companyId]: rows }));
    return rows;
  }, []);

  const addLedgerEntries = useCallback(async (companyId, entries) => {
    await api.appendLedger(companyId, entries);
    await loadLedger(companyId);
    await refreshCompanies();
  }, [loadLedger, refreshCompanies]);

  // --- 예산 트리 ---
  const loadBudgetTree = useCallback(async (companyId) => {
    const rows = await api.getBudgetTree(companyId);
    setBudgetTrees((prev) => ({ ...prev, [companyId]: rows }));
    return rows;
  }, []);

  const updateBudgetTree = useCallback(async (companyId, rows) => {
    const saved = await api.saveBudgetTree(companyId, rows);
    setBudgetTrees((prev) => ({ ...prev, [companyId]: saved }));
    return saved;
  }, []);

  const refreshAmendments = useCallback(async () => {
    const as = await api.listAmendments();
    setAmendments(as);
  }, []);

  // --- 과제 ---
  const submitAmendment = async (a) => {
    const result = await api.submitAmendment(a);
    setAmendments((p) => [result || a, ...p]);
    return result;
  };

  const issueProject = async (proj) => {
    await api.issueCompany(proj);
    setCompanies((cs) => [...cs, proj]);
  };

  const completeRegistration = async (id, researchers, acctInfo) => {
    await api.completeRegistration(id, researchers, acctInfo);
    setCompanies((cs) => cs.map((c) => (c.id === id ? { ...c, researchers, status: "집행중", bankName: acctInfo?.bank, bankAccount: acctInfo?.account, bankHolder: acctInfo?.holder } : c)));
  };

  const decideAmendment = async (id, decision, comment) => {
    await api.decideAmendment(id, decision, comment);
    const target = amendments.find((a) => a.id === id);
    if (decision === "승인" && target) {
      if (target.type === "사업비 변경") {
        const after = target.after || (target.detail && JSON.parse(target.detail).after);
        if (after) setCompanies((cs) => cs.map((c) => (c.id === target.companyId ? { ...c, budget: { ...after } } : c)));
      } else if (target.type === "연구기간 변경") {
        const pa = target.periodAfter || (target.detail && JSON.parse(target.detail).periodAfter);
        if (pa) setCompanies((cs) => cs.map((c) => (c.id === target.companyId ? { ...c, period: pa } : c)));
      } else if (target.type === "참여연구원 변경") {
        const ra = target.researchersAfter || (target.detail && JSON.parse(target.detail).researchersAfter);
        if (ra) setCompanies((cs) => cs.map((c) => (c.id === target.companyId ? { ...c, researchers: ra } : c)));
      }
    }
    setAmendments((p) => p.map((a) => (a.id === id ? { ...a, status: decision, reviewComment: comment, reviewedAt: new Date().toISOString().slice(0, 10) } : a)));
  };

  return (
    <AppCtx.Provider value={{
      companies, amendments, loading,
      ledgers, budgetTrees,
      loadLedger, addLedgerEntries,
      loadBudgetTree, updateBudgetTree,
      submitAmendment, issueProject, completeRegistration, decideAmendment,
      refreshCompanies, refreshAmendments,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
