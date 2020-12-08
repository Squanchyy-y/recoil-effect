import React from "react";
import { useRecoilEffectsValue } from "recoil-effects";
import { $scanners } from "./state";

const Scanners: React.FC = () => {
    const scanners = useRecoilEffectsValue($scanners);
    return <div>{scanners.map(({name}) => <div key={name}>{name}</div>)}</div>;
}

export default Scanners;