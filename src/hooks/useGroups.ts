import type { Group } from "@/types/team";
import { useJsonResource } from "./useJsonResource";
import { dataUrl } from "@/utils/dataUrl";

export function useGroups() {
  return useJsonResource<Group[]>(dataUrl("groups.json"));
}
