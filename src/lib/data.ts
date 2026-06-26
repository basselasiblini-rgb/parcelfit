import { readFile } from "fs/promises";
import path from "path";
import { parseCSV, toInvestor, toParcel } from "./csv";
import type { Investor, Parcel } from "./types";

// Read the challenge CSVs from /public/data and cache them in module scope.
// In a hackathon a file read per cold start is fine; caching keeps warm requests instant.
let investorsCache: Investor[] | null = null;
let parcelsCache: Parcel[] | null = null;

const DATA_DIR = path.join(process.cwd(), "public", "data");

export async function loadInvestors(): Promise<Investor[]> {
  if (investorsCache) return investorsCache;
  const text = await readFile(path.join(DATA_DIR, "sample_investors.csv"), "utf8");
  investorsCache = parseCSV(text).map(toInvestor);
  return investorsCache;
}

export async function loadParcels(): Promise<Parcel[]> {
  if (parcelsCache) return parcelsCache;
  const text = await readFile(path.join(DATA_DIR, "sample_parcels.csv"), "utf8");
  parcelsCache = parseCSV(text).map(toParcel);
  return parcelsCache;
}

export async function getInvestor(id: string): Promise<Investor | undefined> {
  const investors = await loadInvestors();
  return investors.find((i) => i.investor_id === id);
}
