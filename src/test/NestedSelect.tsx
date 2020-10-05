import React from "react";
import { useRecoilEffectValue } from "recoil-effect";
import { selectUnitsLength } from "./state";

const NestedSelect: React.FC = () => {
    const numUnits = useRecoilEffectValue(selectUnitsLength);
    return <div>Number of units: {numUnits}</div>;
}

export default NestedSelect;