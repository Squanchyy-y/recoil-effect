import React from "react";
import { useRecoilEffectsValue } from "recoil-effects";
import { selectUnitsLength } from "./state";

const NestedSelect: React.FC = () => {
    const numUnits = useRecoilEffectsValue(selectUnitsLength);
    return <div>Number of units: {numUnits}</div>;
}

export default NestedSelect;