import React from "react";
import { useRecoilEffectsValue } from "recoil-effects";
import { selectDevices } from "./state";

const Select: React.FC = () => {
    const devices = useRecoilEffectsValue(selectDevices)
    return <div>{devices.map(({name}) => <div key={name}>{name}</div>)}</div>
}

export default Select;