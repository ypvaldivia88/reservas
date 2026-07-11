export type SpecialDayDateMode = "single" | "range" | "multiple";

export interface EditingSpecialDayState {
  _id?: string;
  dateMode: SpecialDayDateMode;
  singleDate: string;
  startDate: string;
  endDate: string;
  multipleDates: string[];
  reason: string;
  isWorkingDay: boolean;
  slots: string;
  isEditing: boolean;
}

export const EMPTY_EDITING_SPECIAL_DAY: EditingSpecialDayState = {
  dateMode: "single",
  singleDate: "",
  startDate: "",
  endDate: "",
  multipleDates: [],
  reason: "",
  isWorkingDay: false,
  slots: "",
  isEditing: false,
};
