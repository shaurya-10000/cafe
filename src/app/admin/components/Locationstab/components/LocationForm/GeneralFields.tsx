import { memo } from "react";

import { ariaErrorProps } from "../../lib/fieldErrors";
import { INPUT_CLASS, LEGEND_CLASS } from "../../styles";
import type { AdminLocation } from "../../types";
import { FieldBlock } from "./FieldBlock";

interface GeneralFieldsProps {
  location: AdminLocation | null;
  nameError: string | undefined;
}

export const GeneralFields = memo(function GeneralFields({
  location,
  nameError,
}: GeneralFieldsProps) {
  return (
    <fieldset className="space-y-4">
      <legend className={LEGEND_CLASS}>General</legend>

      <FieldBlock id="location-name" label="Location name" error={nameError}>
        <input
          id="location-name"
          name="name"
          type="text"
          defaultValue={location?.name ?? ""}
          placeholder="Location Name (e.g. Downtown)"
          className={INPUT_CLASS}
          required
          minLength={1}
          maxLength={120}
          {...ariaErrorProps("location-name", nameError)}
        />
      </FieldBlock>

      <label className="flex items-center gap-3 px-1">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={location?.isActive ?? true}
          className="h-4 w-4 accent-cafe-accent"
        />

        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Visible to customers
        </span>
      </label>
    </fieldset>
  );
});
