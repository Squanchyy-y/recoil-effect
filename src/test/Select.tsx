import React from "react";
import {useRecoilEffectValue} from "recoil-effect"
import {selectDevices} from "./state";

const Select = () => {
    const devices = useRecoilEffectValue(selectDevices)
    return <div>{devices.map(({name}) => <div key={name}>{name}</div>)}</div>
}

export default Select;