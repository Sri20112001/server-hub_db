import {
  siPostgresql,
  siMysql,
  siRedis,
  siMongodb,
  siMariadb,
  siSqlite,
  type SimpleIcon,
} from "simple-icons";
import { Database } from "lucide-react";

interface DatabaseIconProps {
  engine: string;
  size?: number;
  className?: string;
  colored?: boolean;
}

const ENGINE_MAP: Record<string, SimpleIcon> = {
  postgres: siPostgresql,
  postgresql: siPostgresql,
  psql: siPostgresql,
  mysql: siMysql,
  redis: siRedis,
  valkey: siRedis,
  keydb: siRedis,
  mongo: siMongodb,
  mongodb: siMongodb,
  mariadb: siMariadb,
  sqlite: siSqlite,
  sqlite3: siSqlite,
};

const BRAND_COLORS: Record<string, string> = {
  postgres: "#336791",
  postgresql: "#336791",
  psql: "#336791",
  mysql: "#00758F",
  redis: "#DC382D",
  valkey: "#DC382D",
  keydb: "#DC382D",
  mongo: "#13AA52",
  mongodb: "#13AA52",
  mariadb: "#C49A45",
  sqlite: "#003B57",
  sqlite3: "#003B57",
};

export function DatabaseIcon({
  engine,
  size = 16,
  className = "",
  colored = true,
}: DatabaseIconProps) {
  const norm = (engine || "").toLowerCase().trim();
  const icon = ENGINE_MAP[norm];

  if (!icon) {
    return <Database size={size} className={className} />;
  }

  const brandColor = BRAND_COLORS[norm] ?? `#${icon.hex}`;
  const fill = colored ? brandColor : "currentColor";

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${icon.title} icon`}
    >
      <path d={icon.path} />
    </svg>
  );
}

/**
 * A decorative badge featuring the authentic brand icon and colors
 */
export function DatabaseBadge({
  engine,
  size = "md",
}: {
  engine: string;
  size?: "sm" | "md" | "lg";
}) {
  const norm = (engine || "").toLowerCase().trim();
  const icon = ENGINE_MAP[norm];
  const title = icon ? icon.title : engine.toUpperCase();

  const iconSize = size === "sm" ? 13 : size === "lg" ? 20 : 16;
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : size === "lg" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded-md border border-line dark:border-edge bg-paper/80 dark:bg-abyss/80 text-ink dark:text-bone ${padding}`}
    >
      <DatabaseIcon engine={engine} size={iconSize} />
      <span>{title}</span>
    </span>
  );
}
