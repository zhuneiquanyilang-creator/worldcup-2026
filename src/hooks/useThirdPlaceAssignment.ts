import { useJsonResource } from "./useJsonResource";
import { dataUrl } from "@/utils/dataUrl";
import type { ThirdPlaceAssignment } from "@/types/thirdPlace";

export function useThirdPlaceAssignment() {
  return useJsonResource<ThirdPlaceAssignment>(
    dataUrl("third_place_assignment.json")
  );
}
