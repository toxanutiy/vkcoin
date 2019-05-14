import React from "react";
import {Div, Group} from '@vkontakte/vkui';

class Upgrades extends React.Component {
    render() {
        const upgrades = this.props.upgrades;
        return (
            Object.keys(upgrades).map((key) => (
                <Group key={key} style={{height: "60px", borderRadius: "20px", marginLeft: "10px", textAlign: "center"}}>
                    <Div className="upgrade" style={{width: "180px"}}>
                        <span className="name">{upgrades[key].name} (x{upgrades[key].amount})</span><br></br>
                        <span className="mine">{upgrades[key].mine}/сек</span>
                    </Div>
                </Group>
            ))
        );
    }
}

export default Upgrades;
