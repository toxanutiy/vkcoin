import React from 'react';
import connect from '@vkontakte/vkui-connect';
import {View, Panel, Header, Button, Div, HorizontalScroll, PopoutWrapper, Group} from '@vkontakte/vkui';
import PanelSpinner from '@vkontakte/vkui/dist/components/PanelSpinner/PanelSpinner';
import '@vkontakte/vkui/dist/vkui.css';
import io from 'socket.io-client';
import './css/style.css';
import Upgrades from './panels/Upgrades.js'
import Icon24Cancel from '@vkontakte/icons/dist/24/cancel';

let socket = io('http://192.168.43.27:8080');

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activePanel: 'spinner',
            user: null,
            popout: null,
            buyItem: false
        };

        this.openShop = this.openShop.bind(this);
    }

    componentDidMount() {
        connect.subscribe((e) => {
            switch (e.detail.type) {
                default:
                    console.log(e.detail.type);
            }
        });

        socket.emit('auth', window.location.search);

        socket.on('setUser', user => {
            this.setState({user: user, activePanel: 'main'});
        });

        socket.on('buysItem', user => {
            this.setState({user: user, buyItem: false});
        });

        setInterval(() => {
            if (this.state.user !== null && !this.state.buyItem)
                socket.emit('setScore', this.state.user.balance);
        }, 500);

        setInterval( () => {
            if (this.state.popout !== null && !this.state.buyItem) {
                this.openShop();
            }
        }, 1000);

        setInterval( () => {
            if (this.state.user !== null)
                this.setState(prevState => ({
                     user: {
                         ...prevState.user,
                         balance: prevState.user.balance + this.state.user.auto
                     }
                }));
        }, 1000);
    }

    click = () => {
        this.setState(prevState => ({
            user: {
                ...prevState.user,
                balance: prevState.user.balance + 1
            }
        }));
    };

    openShop = () => {
        this.setState({
            popout:
                <PopoutWrapper>
                    <Group style={{width: "100%", height: "84%", marginTop: "39%", borderTopLeftRadius: "20px", borderTopRightRadius: "20px"}}>
                        <Div>
                            <Header aside={<Icon24Cancel onClick={this.closeShop}/>}><span
                                style={{fontWeight: "700"}}>Ускорения</span></Header>
                            <hr></hr>
                            <div className="scrollShop">
                                <div className="scrollShop_in">
                                    <div className="shops">
                                        {
                                            Object.keys(this.state.user.shop).map((key) => (
                                                <Group key={key} className="shop">
                                                    <Div className="upgrade">
                                                        <span className="name">{this.state.user.shop[key]['name']}</span>
                                                        <span className="name" style={{float: "right"}}>+{this.state.user.shop[key]['mine']}/сек</span>
                                                        <br></br>
                                                        <Button disabled={(parseFloat(this.state.user.balance) < parseFloat(this.state.user.shop[key]['price']))} onClick={() => this.buyItem(key)} style={{marginTop: "10px"}}>Купить за {this.state.user.shop[key]['price']}</Button>
                                                    </Div>
                                                    <hr></hr>
                                                </Group>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </Div>
                    </Group>
                </PopoutWrapper>
        });
    };

    closeShop = () => {
        this.setState({
            popout: null
        });
    };

    buyItem = async (key) => {
        const item = this.state.user.shop[key];

        if (parseInt(this.state.user.balance) < parseInt(item['price'])) return;

        this.setState({buyItem: true});
        await socket.emit('buyItem', key);
    };

    go = (e) => {
        this.setState({activePanel: e.currentTarget.dataset.to})
    };

    render() {
        if (this.state.user !== null) {
            return (
                <View popout={this.state.popout} header={false} activePanel={this.state.activePanel}>
                    <Panel id="main">
                        <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
                            <Header level="2">Ваш счёт</Header>
                            <span className="balance">{this.state.user.balance}</span>

                            <Div>
                                <Button>Топ</Button>
                                <Button style={{marginLeft: "10px"}}>Перевести</Button>
                                <Button onClick={this.openShop} style={{marginLeft: "10px"}}>Ускорения</Button>
                            </Div>
                        </div>

                        <hr></hr>
                        <Header level="2">Автоматически: {this.state.user.auto}/сек</Header>
                        {
                            Object.keys(this.state.user.upgrades).length === 0 ?
                                <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}><Button
                                    style={{width: "80%", height: "50px"}} onClick={this.openShop}>Получить
                                    улучшения</Button></div>
                                : <HorizontalScroll>
                                    <div style={{display: 'flex'}}><Upgrades upgrades={this.state.user.upgrades}/></div>
                                </HorizontalScroll>
                        }
                        <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
                            <Button onClick={this.click} className="click">Клик</Button>
                        </div>
                    </Panel>
                </View>
            );
        } else {
            return (
                <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
                    <PanelSpinner/>
                </div>
            )
        }
    }
}

export default App;
