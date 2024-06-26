/* eslint-disable react-hooks/exhaustive-deps */
"use client";
// Dependencies
// Hooks
import React, { useState } from "react";
import * as fonciiUserSliceActions from "../../../../../redux/entities/slices/fonciiUser";
import { getFonciiUserSlice } from "../../../../../redux/operations/selectors";
import { FonciiAPIClientAdapter } from "../../../../../services/foncii-api/adapters/fonciiAPIClientAdapter";

// Simple context that allows the user to update their profile picture.
export default function ImpersonateUserContext(): React.ReactNode {
  const [impersonatedUserInput, setImpersonatedUserInput] = useState("");
  const userSlice = getFonciiUserSlice()();
  const fonciiAPIService = () => new FonciiAPIClientAdapter();

  const onClickFetchImpersonatedUser = async () => {
    const desiredUser =
      impersonatedUserInput === ""
        ? userSlice.impersonatingUser?.username
        : impersonatedUserInput.toLowerCase();
    if (desiredUser) {
      const user = await fonciiAPIService().fetchImpersonatedUser({
        userID: userSlice.user!.id,
        impersonatedUserName: desiredUser,
      });
      fonciiUserSliceActions.setImpersonatedUser(user);
    }
  };

  const handleTextInputChange = (e: any) => {
    const newTextInput = (e.target.value as string) ?? "";
    setImpersonatedUserInput(newTextInput);
  };

  return (
    <div className="flex flex-col h-fit w-[250px] py-[10px] items-center justify-center gap-y-[20px]">
      <div className="flex flex-col items-center justify-center w-full h-fit">
        <input
          name="Impersonated User Input"
          value={impersonatedUserInput}
          onChange={handleTextInputChange}
          spellCheck="false"
          className={`w-full leading-relaxed text-left bg-transparent border-[0.5px] border-medium font-normal text-[16px] whitespace-nowrap outline-1 overflow-hidden`}
        />
        <button
          onClick={onClickFetchImpersonatedUser}
          className={`h-fit w-fit flex justify-center items-center p-[15px]`}
        >
          <p className="text-invalid_input_red text-[16px] font-regular h-fit rounded-full hover:bg-white">
            Impersonate
          </p>
        </button>
      </div>
    </div>
  );
}
