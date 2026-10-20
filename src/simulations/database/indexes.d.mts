export type IndexLayout = "ordered" | "scattered";
export type IndexQuery = "narrow" | "wide" | "all" | "empty";
export type IndexPath = "scan" | "index";
export interface IndexRow {
  readonly id: number; readonly customer_id: number;
  readonly created_at: string; readonly day: number;
}
export interface HeapSlot { readonly slot: number; readonly rowId: number }
export interface HeapPage { readonly id: string; readonly slots: readonly HeapSlot[] }
export interface IndexEntry {
  readonly id: string; readonly rowId: number; readonly key: string;
  readonly day: number; readonly leafPageId: string;
  readonly heapPageId: string; readonly slot: number;
}
export interface IndexRootPage {
  readonly id: string; readonly kind: "root";
  readonly children: readonly {
    readonly pageId: string; readonly lowerBoundKey: string; readonly lowerBoundDay: number;
  }[];
}
export interface IndexLeafPage {
  readonly id: string; readonly kind: "leaf"; readonly entries: readonly IndexEntry[];
  readonly nextPageId: string | null;
}
export type IndexPage = IndexRootPage | IndexLeafPage;
export interface IndexFixture {
  readonly layout: IndexLayout; readonly rows: readonly IndexRow[];
  readonly heapPages: readonly HeapPage[]; readonly indexPages: readonly IndexPage[];
  readonly entries: readonly IndexEntry[]; readonly rootPageId: string;
  readonly leafPageIds: readonly string[]; readonly assumptions: readonly string[];
}
export interface IndexRange {
  readonly fromDay: number; readonly toDay: number;
  readonly fromInclusive: string; readonly toExclusive: string;
}
export interface IndexMeasurement { readonly value: number; readonly unit: string }
export interface IndexStopProof {
  readonly kind: "next-key" | "end-marker" | "heap-exhausted";
  readonly pageId: string; readonly entry: IndexEntry | null;
  readonly detail: string;
}
export interface IndexComparison {
  readonly entryId: string; readonly rowId: number; readonly key: string;
  readonly day: number; readonly relation: "before-range" | "match" | "after-range";
}
export interface IndexRouteComparison {
  readonly pageId: string; readonly key: string;
  readonly day: number; readonly relation: "at-or-before" | "after";
}
export interface IndexEvent {
  readonly id: string; readonly kind: "root" | "leaf" | "heap" | "complete";
  readonly indexPageId: string | null; readonly heapPageId: string | null;
  readonly selectedChildPageId: string | null;
  readonly comparisons: readonly IndexComparison[];
  readonly routingComparisons: readonly IndexRouteComparison[];
  readonly comparedRowIds: readonly number[]; readonly returnedRowIds: readonly number[];
  readonly selectedEntry: IndexEntry | null; readonly stopProof: IndexStopProof | null;
  readonly title: string; readonly detail: string;
}
export interface IndexFrame {
  readonly scenarioId: string; readonly step: number;
  readonly observationKind: "educational-page-access";
  readonly layout: IndexLayout; readonly query: IndexQuery; readonly path: IndexPath;
  readonly fixture: IndexFixture; readonly range: IndexRange; readonly sql: string;
  readonly title: string; readonly detail: string; readonly assumptions: readonly string[];
  readonly event: IndexEvent | null; readonly events: readonly IndexEvent[];
  readonly indexPageIds: readonly string[]; readonly heapPageIds: readonly string[];
  readonly returnedRowIds: readonly number[]; readonly selectedEntry: IndexEntry | null;
  readonly stopProof: IndexStopProof | null;
  readonly measurements: {
    readonly indexPages: IndexMeasurement; readonly heapPages: IndexMeasurement;
    readonly totalPages: IndexMeasurement; readonly keyComparisons: IndexMeasurement;
    readonly rowComparisons: IndexMeasurement; readonly returnedRows: IndexMeasurement;
  };
  readonly finished: boolean;
}
export type IndexWriteOperation = "insert" | "indexed-key-update";
export interface LogicalIndexEntry {
  readonly rowId: number; readonly key: string; readonly leafPageId: string;
}
export interface IndexWriteEvent {
  readonly id: string; readonly kind: "logical-record" | "index-entry" | "complete";
  readonly structureId: "logical-records" | "created-at-index" | null;
  readonly leafPageIds: readonly string[];
  readonly recordChanges: number; readonly entryAdditions: number; readonly entryRemovals: number;
  readonly title: string; readonly detail: string;
}
export interface IndexWriteFrame {
  readonly scenarioId: string; readonly step: number;
  readonly observationKind: "logical-write-impact"; readonly operation: IndexWriteOperation;
  readonly indexed: boolean; readonly title: string; readonly detail: string;
  readonly assumptions: readonly string[];
  readonly record: { readonly before: IndexRow | null; readonly after: IndexRow };
  readonly indexChange: {
    readonly kind: "add" | "move" | "none";
    readonly before: LogicalIndexEntry | null; readonly after: LogicalIndexEntry | null;
  };
  readonly event: IndexWriteEvent | null; readonly events: readonly IndexWriteEvent[];
  readonly affectedStructureIds: readonly string[]; readonly affectedLeafPageIds: readonly string[];
  readonly measurements: {
    readonly logicalRecordChanges: IndexMeasurement; readonly indexEntryAdditions: IndexMeasurement;
    readonly indexEntryRemovals: IndexMeasurement; readonly affectedStructures: IndexMeasurement;
  };
  readonly finished: boolean;
}
export interface CompositeIndexEntry {
  readonly id: string; readonly position: number; readonly rowId: number;
  readonly customerId: number; readonly key: string; readonly day: number;
  readonly matches: boolean;
}
export interface CompositeIndexResult {
  readonly observationKind: "composite-key-order"; readonly fixture: IndexFixture;
  readonly customerId: number | null; readonly range: IndexRange; readonly sql: string;
  readonly sampleRowIds: readonly number[];
  readonly entries: readonly CompositeIndexEntry[];
  readonly customerGroups: readonly {
    readonly customerId: number; readonly start: number; readonly endExclusive: number;
  }[];
  readonly spans: readonly {
    readonly customerId: number; readonly start: number; readonly endExclusive: number;
    readonly rowIds: readonly number[]; readonly entryIds: readonly string[];
  }[];
  readonly returnedRowIds: readonly number[]; readonly assumptions: readonly string[];
  readonly measurements: {
    readonly spanCount: IndexMeasurement; readonly matchingRows: IndexMeasurement;
  };
}
export const INDEX_LAYOUTS: readonly IndexLayout[];
export const INDEX_QUERIES: readonly IndexQuery[];
export const INDEX_PATHS: readonly IndexPath[];
export function createIndexFixture(layout?: IndexLayout): IndexFixture;
export function indexFrames(options?: {
  layout?: IndexLayout; query?: IndexQuery; path?: IndexPath;
}): readonly IndexFrame[];
export function indexWriteFrames(options?: {
  operation?: IndexWriteOperation; indexed?: boolean;
}): readonly IndexWriteFrame[];
/** fixture must be an unchanged createIndexFixture result or its structural clone. */
export function compositeIndexSpans(options?: {
  customerId?: number; fixture?: IndexFixture;
}): CompositeIndexResult;
