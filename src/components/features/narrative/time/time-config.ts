import { merge } from "lodash";
import { SHARED_CONFIG } from "@/components/features/narrative/shared/visualization-config";

export const TIME_CONFIG = merge({}, SHARED_CONFIG, {});
