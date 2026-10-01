"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowUpRight, Check, Search } from "lucide-react";

const accounts = [
  {
    key: "renewal",
    initials: "NP",
    score: 64,
    tone: "attention",
    owner: "Maya Chen",
    due: "days21",
  },
  {
    key: "usage",
    initials: "AC",
    score: 42,
    tone: "risk",
    owner: "Omar Ali",
    due: "today",
  },
  {
    key: "stakeholder",
    initials: "VL",
    score: 82,
    tone: "healthy",
    owner: "Lina Noor",
    due: "days3",
  },
] as const;

export function OperationsWorkspace() {
  const t = useTranslations("marketing.portfolio");
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = accounts[activeIndex];
  const signals = [t("renewalWindow"), t("usageDrop"), t("stakeholderQuiet")];
  const actions = [t("renewalPlan"), t("execCall"), t("sponsorReview")];

  return (
    <div className="workspace-demo" aria-label={t("boardLabel")}>
      <div className="workspace-chrome">
        <div className="workspace-brand">
          <span>W</span>
          <strong>Waslix</strong>
        </div>
        <div className="workspace-search">
          <Search aria-hidden="true" />
          {t("search")}
        </div>
        <span className="workspace-illustrative">{t("illustrative")}</span>
      </div>
      <div className="workspace-body">
        <aside className="workspace-sidebar" aria-hidden="true">
          <span className="active" />
          <span />
          <span />
          <span />
          <i />
          <span />
          <span />
        </aside>
        <div className="workspace-main">
          <header className="workspace-heading">
            <div>
              <small>{t("window")}</small>
              <h2>{t("accounts")}</h2>
            </div>
            <span>{t("signalValue")}</span>
          </header>
          <div className="workspace-columns" aria-hidden="true">
            <span>{t("signals")}</span>
            <span>{t("health")}</span>
            <span>{t("owner")}</span>
            <span>{t("action")}</span>
          </div>
          <div className="workspace-rows">
            {accounts.map((account, index) => (
              <button
                key={account.key}
                type="button"
                className="workspace-row"
                data-active={activeIndex === index}
                aria-pressed={activeIndex === index}
                onClick={() => setActiveIndex(index)}
              >
                <span className="account-avatar">{account.initials}</span>
                <span className="row-signal">
                  <i data-tone={account.tone} />
                  {signals[index]}
                </span>
                <strong className={`row-score ${account.tone}`}>
                  {account.score}
                </strong>
                <span className="row-owner">
                  <i>
                    {account.owner
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </i>
                  {account.owner}
                </span>
                <span className="row-action">
                  {actions[index]}
                  <ArrowUpRight aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.key}
              className="workspace-handoff"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <div>
                <span>
                  <Check aria-hidden="true" />
                </span>
                <p>
                  <small>{t("evidenceFresh")}</small>
                  <strong>{signals[activeIndex]}</strong>
                </p>
              </div>
              <i />
              <div>
                <span>
                  <Check aria-hidden="true" />
                </span>
                <p>
                  <small>{t("ownerAssigned")}</small>
                  <strong>{active.owner}</strong>
                </p>
              </div>
              <i />
              <div>
                <span>
                  <Check aria-hidden="true" />
                </span>
                <p>
                  <small>
                    {t("nextAction")} · {t(active.due)}
                  </small>
                  <strong>{actions[activeIndex]}</strong>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
