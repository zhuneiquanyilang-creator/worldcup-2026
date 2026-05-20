import { useParams, Link } from "react-router-dom";
import { useJsonResource } from "@/hooks/useJsonResource";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import type { WorldCupResult, WorldCupKnockout, Award } from "@/types/worldCupResult";
import { PastBracket } from "@/components/past/PastBracket";
import { dataUrl } from "@/utils/dataUrl";
import styles from "./PastTournamentDetailPage.module.css";

type Host = {
  edition: number;
  year: number;
  hosts: string[];
};

const BLANK = "—";

function text(v: string | undefined): string {
  return v && v.trim() !== "" ? v : BLANK;
}

function AwardRow({ label, award }: { label: string; award: Award | undefined }) {
  const player = text(award?.player);
  const nat = award?.nationality?.trim();
  return (
    <div className={styles.awardRow}>
      <span className={styles.awardLabel}>{label}</span>
      <span className={styles.awardPlayer}>
        {player}
        {nat && <span className={styles.awardNat}>（{nat}）</span>}
      </span>
    </div>
  );
}

export function PastTournamentDetailPage() {
  const { year: yearParam } = useParams();
  const year = Number(yearParam);

  const hostsRes = useJsonResource<Host[]>(dataUrl("world_cup_hosts.json"));
  const resultsRes = useJsonResource<WorldCupResult[]>(dataUrl("world_cup_results.json"));
  const knockoutsRes = useJsonResource<WorldCupKnockout[]>(dataUrl("world_cup_knockouts.json"));

  if (
    hostsRes.status === "loading" ||
    resultsRes.status === "loading" ||
    knockoutsRes.status === "loading"
  ) {
    return <Loading />;
  }
  if (hostsRes.status === "error") return <ErrorMessage message={hostsRes.error} />;
  if (resultsRes.status === "error") return <ErrorMessage message={resultsRes.error} />;
  if (knockoutsRes.status === "error") return <ErrorMessage message={knockoutsRes.error} />;

  const host = hostsRes.data.find((h) => h.year === year);
  const result = resultsRes.data.find((r) => r.year === year);
  const knockout = knockoutsRes.data.find((k) => k.year === year);

  if (!host) {
    return (
      <div>
        <p className={styles.notFound}>{yearParam} 年の大会データが見つかりません。</p>
        <Link to="/past" className={styles.back}>← 過去の大会一覧へ</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/past" className={styles.back}>← 過去の大会一覧へ</Link>

      <header className={styles.head}>
        <h1 className={styles.title}>{host.year} FIFAワールドカップ</h1>
        <p className={styles.sub}>
          第{host.edition}回 ・ 開催国: {host.hosts.join(" / ")}
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>結果</h2>
        <div className={styles.rankGrid}>
          <div className={`${styles.rankCard} ${styles.rank1}`}>
            <span className={styles.rankLabel}>1位</span>
            <span className={styles.rankTeam}>{text(result?.first)}</span>
          </div>
          <div className={`${styles.rankCard} ${styles.rank2}`}>
            <span className={styles.rankLabel}>2位</span>
            <span className={styles.rankTeam}>{text(result?.second)}</span>
          </div>
          <div className={`${styles.rankCard} ${styles.rank3}`}>
            <span className={styles.rankLabel}>3位</span>
            <span className={styles.rankTeam}>{text(result?.third)}</span>
          </div>
          <div className={`${styles.rankCard} ${styles.rank4}`}>
            <span className={styles.rankLabel}>4位</span>
            <span className={styles.rankTeam}>{text(result?.fourth)}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>個人賞</h2>
        <div className={styles.awardList}>
          <AwardRow label="最優秀選手（ゴールデンボール）" award={result?.goldenBall} />
          <AwardRow label="シルバーボール" award={result?.silverBall} />
          <AwardRow label="ブロンズボール" award={result?.bronzeBall} />
          <AwardRow label="得点王（ゴールデンブーツ）" award={result?.goldenBoot} />
          <AwardRow label="最優秀GK（ゴールデングローブ）" award={result?.goldenGlove} />
          <AwardRow label="最優秀若手選手（ベストヤングプレーヤー）" award={result?.bestYoungPlayer} />
          <AwardRow label="ベストゴール" award={result?.bestGoal} />
        </div>
      </section>

      {knockout && knockout.matches.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>トーナメント表</h2>
          <PastBracket matches={knockout.matches} />
        </section>
      )}
    </div>
  );
}
