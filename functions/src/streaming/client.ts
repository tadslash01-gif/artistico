import { MuxStreamProvider } from "./mux";
import type { IStreamProvider } from "./provider";

/**
 * Returns the configured stream provider.
 * To swap providers, change the import and instantiation here.
 */
export function getStreamProvider(): IStreamProvider {
  return new MuxStreamProvider();
}
