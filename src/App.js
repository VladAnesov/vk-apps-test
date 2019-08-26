import React from 'react';
import {
    FormLayout,
    Group,
    List,
    ListItem,
    Panel,
    PanelHeader,
    Textarea,
    View,
    Input,
    Button,
    HeaderButton,
    Div,
    ConfigProvider,
    FixedLayout,
    Cell,
    Switch
} from '@vkontakte/vkui';
import * as VKConnect from '@vkontakte/vkui-connect';
import connect from '@vkontakte/vkui-connect-promise';
import '@vkontakte/vkui/dist/vkui.css';

import Icon28ChevronBack from '@vkontakte/icons/dist/28/chevron_back';
import Icon24Back from '@vkontakte/icons/dist/24/back';
import {platform, ANDROID, IOS} from '@vkontakte/vkui/dist/lib/platform';

const VERSION = "5.5.4";

const osname = platform();

export default class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activePanel: "main",
            history: ['main'],
            eventName: "Response",
            events: [
                "VKWebAppShowCommunityWidgetPreviewBox",
                "VKWebAppOpenCodeReader",
                "VKWebAppViewHide",
                "VKWebAppViewRestore",
                "VKWebAppAudioPaused",
                "VKWebAppAudioStopped",
                "VKWebAppAudioTrackChanged",
                "VKWebAppAudioUnpaused",
                "VKWebAppAddToFavorites",
                "VKWebAppGetFriends",
                "VKWebAppAddToCommunity",
                "VKWebAppGetCommunityAuthToken",
                "VKWebAppFlashSetLevel",
                "VKWebAppFlashGetInfo",
                "VKWebAppOpenContacts",
                "VKWebAppGetPersonalCard",
                "VKWebAppResizeWindow",
                "VKWebAppScroll",
                "VKWebAppGetAuthToken",
                "VKWebAppCallAPIMethod",
                "VKWebAppGetGeodata",
                "VKWebAppGetUserInfo",
                "VKWebAppGetPhoneNumber",
                "VKWebAppGetClientVersion",
                "VKWebAppOpenPayForm",
                "VKWebAppShare",
                "VKWebAppAllowNotifications",
                "VKWebAppDenyNotifications",
                "VKWebAppShowWallPostBox",
                "VKWebAppGetEmail",
                "VKWebAppAllowMessagesFromGroup",
                "VKWebAppJoinGroup",
                "VKWebAppOpenApp",
                "VKWebAppOpenQR",
                "VKWebAppSetViewSettings",
            ],
            logEvents: [],
            historyApi: [],
            connectPromise: false,
            paramsHash: '',
        };
    }

    goBack = () => {
        const history = [...this.state.history];
        history.pop();
        const activePanel = history[history.length - 1];
        console.log(activePanel);
        if (activePanel === 'main') {
            this.sendEvent('VKWebAppDisableSwipeBack', {});
        }
        this.setState({history, activePanel});
    };

    goForward = (activePanel) => {
        const history = [...this.state.history];
        history.push(activePanel);
        if (this.state.activePanel === 'main') {
            this.sendEvent('VKWebAppEnableSwipeBack', {});
        }
        this.setState({history, activePanel});
    };

    componentWillMount() {
        this.makeLogEvents();
        this.setState({paramsHash: window.location.hash});

        VKConnect.subscribe((e) => {
            const detail = (e.detail || e);
            const type = detail.type;
            const msg = detail.data;

            // Set actual theme for client
            if (type === "VKWebAppUpdateConfig") {
                if (typeof msg.scheme !== 'undefined') {
                    document.body.setAttribute('scheme', msg.scheme);
                }
            }

            // History Response
            let currentTime = new Date().toLocaleString();

            // Using default vk connect lib && Add vk connect api log
            if (!this.state.connectPromise && this.validateResult(type)) {
                console.log("VKConnect subscribe: get event " + type);
                this.setState({
                    historyApi: [{
                        method: type,
                        response: JSON.stringify(detail, undefined, 4),
                        time: currentTime,
                        promise: this.state.connectPromise,
                        status: (type.indexOf('Failed') !== -1 ? 'error' : 'valid')
                    }, ...this.state.historyApi]
                });
            }
        });
    }

    validateResult(type) {
        if(!type) {
            return false
        }

        return (this.state.logEvents[type.replace(/Result|Failed/g, '')] === true ||
            (
                (type === "VKWebAppGeodataResult" || type === "VKWebAppGeodataFailed")
                &&
                this.state.logEvents["VKWebAppGetGeodata"] === true
            )
            ||
            (
                (type === "VKWebAppAccessTokenReceived" || type === "VKWebAppAccessTokenFailed")
                &&
                this.state.logEvents["VKWebAppGetAuthToken"] === true
            )

        )
    }

    makeLogEvents() {
        let data = this.state.events;
        let newData = Object.keys(data).reduce(function (obj, key) {
            obj[data[key]] = true;
            return obj;
        }, {});

        let logEvents = {
            VKWebAppUpdateInfo: true,
            VKWebAppUpdateInsets: false,
            VKWebAppUpdateConfig: false,
            ...newData
        };

        // set all events for logs
        this.setState({
            logEvents: logEvents
        });
    }

    addToLog(method) {
        let logEvents = Object.assign({}, this.state.logEvents);
        logEvents[method] = true;
        this.setState({logEvents});

        console.log(logEvents);
    }

    sendEvent(event, data, customEvent = false) {
        console.log("VK Connect Sending event: " + event);

        if(customEvent) {
            this.addToLog(event);
            console.log("Add to log new event: " + event);
        }

        if (this.state.connectPromise) {
            console.log("promise detect");
            let connectData = {};
            let connectError = {};
            let currentTime = new Date().toLocaleString();

            console.log("Using VK-Connect promise lib");

            connect.send(event, data)
                .then(data => {
                    connectData = data;
                    console.log(data);

                    // Add vk connect api log
                    if (this.validateResult(event)) {

                        // log history
                        this.setState({
                            historyApi: [{
                                method: connectData["type"] ? connectData["type"] : connectError["type"],
                                response: JSON.stringify(connectData, undefined, 4),
                                time: currentTime,
                                promise: this.state.connectPromise,
                                status: (connectData["type"].indexOf('Failed') !== -1 ? 'error' : 'valid')
                            }, ...this.state.historyApi]
                        });
                    }
                })
                .catch(error => {
                    connectData = error;
                    console.log(error);

                    // Add vk connect api log
                    if (this.validateResult(event)) {

                        console.log("customEvent");
                        console.log(customEvent);
                        // log history
                        this.setState({
                            historyApi: [{
                                method: connectData["type"] ? connectData["type"] : connectError["type"],
                                response: JSON.stringify(connectData, undefined, 4),
                                time: currentTime,
                                promise: this.state.connectPromise,
                                status: (connectData["type"].indexOf('Failed') !== -1 ? 'error' : 'valid')
                            }, ...this.state.historyApi]
                        });
                    }
                });
        } else {
            console.log("Using default vk connect lib");
            VKConnect.send(event, data);
        }
    }

    render() {

        const isHasHash = this.state.paramsHash;

        return (
            <ConfigProvider isWebView={true}>
                <View
                    onSwipeBack={this.goBack}
                    history={this.state.history}
                    activePanel={this.state.activePanel}>
                    <Panel id="main">
                        <PanelHeader>
                            VK App Test {VERSION}
                        </PanelHeader>

                        <Div style={{paddingBottom: 60, paddingLeft: 0, paddingRight: 0, color: 'white'}}>

                            {isHasHash.length > 0 &&
                                <Group title="Fragment Hash">
                                    <FormLayout>
                                        <Textarea value={this.state.paramsHash} />
                                    </FormLayout>
                                </Group>
                            }

                            <Group title="Settings">
                                <FormLayout>

                                    <Cell asideContent={
                                        <Switch
                                            onChange={(e) => {
                                                this.setState({connectPromise: e.target.checked});
                                                console.log("connectPromise set: " + e.target.checked);
                                            }}
                                            defaultChecked={this.state.connectPromise}
                                        />
                                    }>
                                        Использовать VKUI Connect promise
                                    </Cell>

                                    <Button size="xl" level="primary" onClick={() => {
                                        this.goForward("methods");
                                    }}>Управление событиями</Button>
                                </FormLayout>
                            </Group>

                            <Group title="Data">
                                <FormLayout>
                                    <Textarea id='data' placeholder='{"status": "success", "payload": "blabla"}'/>
                                </FormLayout>
                            </Group>

                            <Group title="Custom Event">
                                <FormLayout>
                                    <Input id='customEvent' type="text" autoComplete="off" placeholder="VKWebAppOpen"/>
                                    <Button onClick={() => {
                                        // Send Custom Event
                                        let data = {};
                                        try {
                                            let input = document.getElementById('data').value;
                                            let customEvent = document.getElementById('customEvent').value;

                                            if (input.length > 0) {
                                                data = JSON.parse(input);
                                            }

                                            this.sendEvent(customEvent, data, true);
                                        } catch (e) {
                                            alert(e);
                                        }
                                    }}>Send Custom Event</Button>

                                    <Button onClick={() => {
                                        let customEvent = document.getElementById('customEvent').value;
                                        this.setState({events: [customEvent, ...this.state.events]});
                                    }}>Add to eventList (only local)</Button>
                                </FormLayout>
                            </Group>

                            <Group
                                title={(this.state.historyApi.length > 0) ? this.state.historyApi[0]["method"] : 'Empty'}>
                                <FormLayout>
                                    <Textarea
                                        status={(this.state.historyApi.length > 0) ? this.state.historyApi[0]["status"] : 'default'}
                                        value={(this.state.historyApi.length > 0) ? this.state.historyApi[0]["response"] : ''}
                                    />
                                </FormLayout>
                            </Group>

                            <Group title="Event type">
                                <List>
                                    {this.state.events.map((eventName, eventKey) =>
                                        <ListItem key={eventKey + 1} onClick={() => {
                                            let data = {};
                                            try {
                                                let input = document.getElementById('data').value;
                                                if (input.length > 0) {
                                                    data = JSON.parse(input);
                                                }

                                                this.sendEvent(eventName, data);
                                            } catch (e) {
                                                alert(e);
                                            }
                                        }
                                        }>{eventName}</ListItem>
                                    )}
                                </List>
                            </Group>
                        </Div>

                        <FixedLayout vertical="bottom">
                            <FormLayout>
                                <Button size="xl" level="primary" onClick={() => {
                                    this.goForward("history");
                                }}>Show History Response</Button>
                            </FormLayout>
                        </FixedLayout>
                    </Panel>

                    <Panel id="history">
                        <PanelHeader
                            left={<HeaderButton onClick={this.goBack}>{osname === IOS ?
                                <Icon28ChevronBack/> : <Icon24Back/>}</HeaderButton>}
                            addon={<HeaderButton
                                onClick={this.goBack}>Назад</HeaderButton>}
                        >
                            Response History
                        </PanelHeader>


                        {this.state.historyApi.map((historyApi, index) =>
                            <Group key={index} title={historyApi["method"]} description={historyApi["time"]}>
                                <FormLayout>
                                    <Textarea id={"customField_" + index} status={historyApi["status"]} value={historyApi["response"]}/>
                                    <Div
                                        style={{paddingTop: 0, paddingBottom: 0}}
                                    >Use VKUI
                                        Connect-promise: {historyApi["promise"] ? 'yes' : 'no'}</Div>
                                </FormLayout>
                            </Group>
                        )}
                    </Panel>

                    <Panel id="methods">
                        <PanelHeader
                            left={<HeaderButton onClick={this.goBack}>{osname === IOS ?
                                <Icon28ChevronBack/> : <Icon24Back/>}</HeaderButton>}
                            addon={<HeaderButton
                                onClick={this.goBack}>Назад</HeaderButton>}
                        >
                            Список событий
                        </PanelHeader>

                        <Group title="Добавить событие">
                            <FormLayout>
                                <Input id='customEvent' type="text" autoComplete="off" placeholder="VKWebAppOpen"/>
                                <Button onClick={() => {
                                    let customEvent = document.getElementById('customEvent').value;
                                    this.setState({events: [customEvent, ...this.state.events]});
                                }}>Добавить (локально)</Button>
                            </FormLayout>
                        </Group>

                        <Group title="Логирование событий">
                            <List>
                                {Object.keys(this.state.logEvents).map(function (eventName, index) {
                                    let value = this.state.logEvents[eventName];
                                    return (
                                        <Cell key={index} asideContent={
                                            <Switch
                                                defaultChecked={value}
                                                onChange={(e) => {
                                                    let logEvents = Object.assign({}, this.state.logEvents);
                                                    logEvents[eventName] = e.target.checked;
                                                    this.setState({logEvents});

                                                    console.log(eventName + " set to " + e.target.checked);
                                                    console.log(this.state.logEvents);
                                                }}
                                            />
                                        }>
                                            {eventName}
                                        </Cell>
                                    )
                                }, this)}
                            </List>
                        </Group>
                    </Panel>
                </View>
            </ConfigProvider>
        );
    }
}
