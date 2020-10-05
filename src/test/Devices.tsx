import React from "react";
import { $devices } from "./state";
import { useRecoilEffectValue } from "recoil-effect";

const Devices: React.FC = () => {
    const devices = useRecoilEffectValue($devices);

    return (
        <div>
            {devices.map(({name}) => <div key={name}>{name}</div>)}
        </div>
    )
}

export default Devices