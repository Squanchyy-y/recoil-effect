import React from "react";
import { $devices } from "./state";
import { useRecoilEffectsValue } from "recoil-effects";

const Devices: React.FC = () => {
    const devices = useRecoilEffectsValue($devices);

    return (
        <div>
            {devices.map(({name}) => <div key={name}>{name}</div>)}
        </div>
    )
}

export default Devices