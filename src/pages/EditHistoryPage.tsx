import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTeamDetails } from "@/hooks/useTeamDetails";
import { useTeams } from "@/hooks/useTeams";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import {
  loadOverrides,
  saveOverrides,
  setPastResults as persistPastResults,
} from "@/utils/teamDetailsOverrides";
import type { PastResult } from "@/types/teamDetail";
import styles from "./EditHistoryPage.module.css";

const WC_YEARS = [
  1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978, 1982, 1986,
  1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026,
];

const RESULT_OPTIONS = [
  "優勝",
  "準優勝",
  "3位",
  "4位",
  "ベスト8",
  "ベスト16",
  "ベスト32",
  "グループステージ敗退",
];

function notifyOverrideChange() {
  window.dispatchEvent(new Event("team-details-override-changed"));
}

export function EditHistoryPage() {
  const teamsRes = useTeams();
  const detailsRes = useTeamDetails();

  const [currentTeamId, setCurrentTeamId] = useState<string>("");
  const [entries, setEntries] = useState<PastResult[]>([]);
  const [savedMsg, setSavedMsg] = useState<string>("");
  const [exportText, setExportText] = useState<string>("");

  // チームが選ばれたら、その時点のデータでフォーム初期化
  useEffect(() => {
    if (!currentTeamId) return;
    if (detailsRes.status !== "ready") return;
    const d = detailsRes.data.find((x) => x.teamId === currentTeamId);
    setEntries(d ? [...(d.pastResults ?? [])] : []);
    setSavedMsg("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeamId, detailsRes.status]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.year - b.year);
  }, [entries]);

  if (teamsRes.status === "loading" || detailsRes.status === "loading") {
    return <Loading />;
  }
  if (teamsRes.status === "error") return <ErrorMessage message={teamsRes.error} />;
  if (detailsRes.status === "error") return <ErrorMessage message={detailsRes.error} />;

  const teams = teamsRes.data;
  const currentTeam = teams.find((t) => t.id === currentTeamId);

  const updateEntry = (idx: number, patch: Partial<PastResult>) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };
  const removeEntry = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };
  const addEntry = () => {
    setEntries((prev) => [...prev, { year: 2022, result: "グループステージ敗退" }]);
  };
  const handleSave = () => {
    if (!currentTeamId) return;
    persistPastResults(currentTeamId, [...entries].sort((a, b) => a.year - b.year));
    notifyOverrideChange();
    setSavedMsg(`${currentTeam?.name ?? currentTeamId} の過去成績を保存しました（ブラウザ内）`);
  };
  const handleReset = () => {
    if (!currentTeamId || detailsRes.status !== "ready") return;
    // 上書きを消してファイルの値に戻す
    const o = loadOverrides();
    delete o[currentTeamId];
    saveOverrides(o);
    notifyOverrideChange();
    const d = detailsRes.data.find((x) => x.teamId === currentTeamId);
    setEntries(d ? [...(d.pastResults ?? [])] : []);
    setSavedMsg(`${currentTeam?.name ?? currentTeamId} の上書きを解除しました`);
  };
  const handleExport = () => {
    if (detailsRes.status !== "ready") return;
    // 全48チーム分の team_details.json を生成（pastResults は最新のマージ後の値）
    const out = detailsRes.data;
    setExportText(JSON.stringify(out, null, 2));
  };

  return (
    <div className={styles.page}>
      <div className={styles.headRow}>
        <h1 className={styles.title}>過去の成績 編集</h1>
        <Link to="/" className={styles.back}>← トップへ</Link>
      </div>
      <p className={styles.note}>
        変更はブラウザ内の localStorage に保存され、チーム詳細ページに即時反映されます。
        ファイル（<code>public/data/team_details.json</code>）に反映するには「JSON出力」を押し、
        表示された JSON をファイルにコピペしてください。
      </p>

      <div className={styles.selector}>
        <label className={styles.label} htmlFor="team-select">
          チーム
        </label>
        <select
          id="team-select"
          className={styles.select}
          value={currentTeamId}
          onChange={(e) => setCurrentTeamId(e.target.value)}
        >
          <option value="">— 選択 —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.flag} {t.name} ({t.id})
            </option>
          ))}
        </select>
      </div>

      {currentTeamId && (
        <section className={styles.editor}>
          <h2 className={styles.subTitle}>{currentTeam?.name} の出場履歴</h2>

          {sortedEntries.length === 0 ? (
            <p className={styles.empty}>まだエントリがありません。「+ 追加」で行を作成してください。</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>年</th>
                  <th>成績</th>
                  <th aria-label="操作"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr key={idx}>
                    <td>
                      <select
                        className={styles.input}
                        value={e.year}
                        onChange={(ev) => updateEntry(idx, { year: Number(ev.target.value) })}
                      >
                        {WC_YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={styles.input}
                        value={e.result}
                        onChange={(ev) => updateEntry(idx, { result: ev.target.value })}
                      >
                        {RESULT_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeEntry(idx)}
                        className={styles.deleteBtn}
                        aria-label="この行を削除"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className={styles.actions}>
            <button type="button" onClick={addEntry} className={styles.addBtn}>
              + 追加
            </button>
            <button type="button" onClick={handleSave} className={styles.saveBtn}>
              保存
            </button>
            <button type="button" onClick={handleReset} className={styles.resetBtn}>
              上書きを解除（ファイル値へ戻す）
            </button>
          </div>
          {savedMsg && <p className={styles.savedMsg}>{savedMsg}</p>}
        </section>
      )}

      <section className={styles.exportSection}>
        <h2 className={styles.subTitle}>JSON 出力</h2>
        <p className={styles.note}>
          現在のマージ後データ（ファイル + 全チームの上書き）を出力します。
          コピーして <code>public/data/team_details.json</code> に貼り付けると永続化されます。
        </p>
        <button type="button" onClick={handleExport} className={styles.exportBtn}>
          JSON を出力
        </button>
        {exportText && (
          <textarea
            className={styles.exportText}
            value={exportText}
            readOnly
            spellCheck={false}
          />
        )}
      </section>
    </div>
  );
}
