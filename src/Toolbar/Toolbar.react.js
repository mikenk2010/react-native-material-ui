import {
    Animated,
    findNodeHandle,
    StyleSheet,
    NativeModules,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Icon from '../Icon';
import IconToggle from '../IconToggle';
import isFunction from '../utils/isFunction';
import React, { Component, PropTypes } from 'react';

const UIManager = NativeModules.UIManager;


const propTypes = {
    /**
    * Indicates if search is active or not
    */
    isSearchActive: PropTypes.bool,
    /**
    * When you want to activate search feature you have to pass this object with config of search.
    */
    searchable: PropTypes.shape({
        /**
        * Called when search text was changed.
        */
        onChangeText: PropTypes.func,
        /**
        * Called when search was closed.
        */
        onSearchClosed: PropTypes.func,
        /**
        * Called when search was opened.
        */
        onSearchPressed: PropTypes.func,
        /**
        * Called when user press submit button on hw keyboard
        */
        onSubmitEditing: PropTypes.func,
        /**
        * Will shown as placeholder for search input.
        */
        placeholder: PropTypes.string,
        /**
        * Indicates when input should be focused after the search is opened.
        */
        autoFocus: PropTypes.bool,
    }),
    /**
    * You can overide any style for the component via this prop
    */
    style: PropTypes.shape({
        container: Animated.View.propTypes.style,
        leftElementContainer: View.propTypes.style,
        leftElement: Text.propTypes.style,
        centerElementContainer: Animated.View.propTypes.style,
        titleText: Text.propTypes.style,
        rightElementContainer: View.propTypes.style,
        rightElement: Text.propTypes.style,
    }),
    /**
    * Just alias for style={{ rightElement: {}, leftElement: {}}}
    */
    iconProps: PropTypes.shape({
        size: PropTypes.number,
        color: PropTypes.string,
    }),
    /**
    * DEPRECATED: (use style prop instead)
    * If it's true, the toolbar has elevation set to 0 and position absolute, left, right set to 0.
    * This prop will be deprecated probably, because it's not pretty clear what it does. I use
    * it during the animation of toolbar, but I can use the style prop that is much more obvious.
    */
    translucent: PropTypes.bool,
    /**
    * Called when centerElement was pressed.
    * TODO: better to rename to onCenterElementPress
    */
    onPress: PropTypes.func,
    /**
    * Will be shown on the left side.
    */
    leftElement: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    /**
    * Called when leftElement was pressed.
    */
    onLeftElementPress: PropTypes.func,
    /**
    * Will be shown between leftElement and rightElement. Usually use for title.
    */
    centerElement: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    /**
    * Will be shown on the right side.
    */
    rightElement: PropTypes.oneOfType([
        /**
        * Whatever you want to have on the right side
        */
        PropTypes.element,
        /**
        * One action (name of icon). Alias for ['icon1'].
        */
        PropTypes.string,
        /**
        * For many actions: ['icon1', 'icon2', ...]
        */
        PropTypes.arrayOf(PropTypes.string),
        /**
        * For actions and menu. The menu will be shown as last one icon.
        */
        PropTypes.shape({
            actions: PropTypes.arrayOf(
                PropTypes.oneOfType([
                    PropTypes.element,
                    PropTypes.string,
                ]),
            ),
            menu: PropTypes.shape({
                icon: PropTypes.string,
                labels: PropTypes.arrayOf(PropTypes.string),
            }),
        }),
    ]),
    /**
    * Called when rightElement was pressed.
    */
    onRightElementPress: PropTypes.func,
};
const defaultProps = {
    elevation: 4, // TODO: probably useless, elevation is defined in getTheme function
    style: {},
};
const contextTypes = {
    uiTheme: PropTypes.object.isRequired,
};

function getStyles(props, context, state) {
    const { toolbar, toolbarSearchActive } = context.uiTheme;

    const local = {};
    const isSearchActive = state.isSearchActive;

    if (props.translucent) {
        local.container = {
            ...StyleSheet.absoluteFillObject,
            elevation: 0,
        };
    }

    return {
        container: [
            toolbar.container,
            local.container,
            isSearchActive && toolbarSearchActive.container,
            props.style.container,
        ],
        leftElementContainer: [
            toolbar.leftElementContainer,
            isSearchActive && toolbarSearchActive.leftElementContainer,
            props.style.leftElementContainer,
        ],
        leftElement: [
            toolbar.leftElement,
            isSearchActive && toolbarSearchActive.leftElement,
            props.style.leftElement,
        ],
        centerElementContainer: [
            toolbar.centerElementContainer,
            isSearchActive && toolbarSearchActive.centerElementContainer,
            props.style.centerElementContainer,
        ],
        titleText: [
            toolbar.titleText,
            isSearchActive && toolbarSearchActive.titleText,
            props.style.titleText,
        ],
        rightElementContainer: [
            toolbar.rightElementContainer,
            isSearchActive && toolbarSearchActive.rightElementContainer,
            props.style.rightElementContainer,
        ],
        rightElement: [
            toolbar.rightElement,
            isSearchActive && toolbarSearchActive.rightElement,
            props.style.rightElement,
        ],
    };
}

class Toolbar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isSearchActive: props.isSearchActive,
            searchValue: '',
        };
    }
    onMenuPressed = (labels) => {
        const { onRightElementPress } = this.props;

        UIManager.showPopupMenu(
            findNodeHandle(this.refs.menu),
            labels,
            () => {},
            (result, index) => {
                if (onRightElementPress) {
                    onRightElementPress({ action: 'menu', result, index });
                }
            }
        );
    };
    onSearchTextChanged = (value) => {
        const { searchable } = this.props;

        if (isFunction(searchable.onChangeText)) {
            searchable.onChangeText(value);
        }

        this.setState({ searchValue: value });
    };
    onSearchPressed = () => {
        const { searchable } = this.props;

        if (isFunction(searchable.onSearchPressed)) {
            searchable.onSearchPressed();
        }

        this.setState({
            isSearchActive: true,
            searchValue: '',
        });
    };
    onSearchClosePressed = () => {
        const { searchable } = this.props;

        if (isFunction(searchable.onSearchClosed)) {
            searchable.onSearchClosed();
        }

        this.setState({
            isSearchActive: false,
            searchValue: '',
        });
    };
    focusSearchField() {
        this.searchFieldRef.focus();
    }
    renderLeftElement = (style) => {
        const { leftElement, onLeftElementPress } = this.props;

        if (!leftElement && !this.state.isSearchActive) {
            return null;
        }

        let iconName = leftElement;
        let onPress = onLeftElementPress;

        if (this.state.isSearchActive) {
            iconName = 'arrow-back';
            onPress = this.onSearchClosePressed;
        }

        const flattenLeftElement = StyleSheet.flatten(style.leftElement);

        return (
            <View style={style.leftElementContainer}>
                <IconToggle
                    name={iconName}
                    color={flattenLeftElement.color}
                    onPress={onPress}
                    style={style.leftElement}
                />
            </View>
        );
    }
    renderCenterElement = (style) => {
        if (!this.state.isSearchActive) {
            const { centerElement, onPress } = this.props;

            let content = null;

            if (typeof centerElement === 'string') {
                content = (
                    <Animated.View style={style.centerElementContainer}>
                        <Text numberOfLines={1} style={style.titleText}>
                            {centerElement}
                        </Text>
                    </Animated.View>
                );
            } else {
                content = centerElement;
            }

            if (!content) {
                return null;
            }

            return (
                <TouchableWithoutFeedback key="center" onPress={onPress}>
                    {content}
                </TouchableWithoutFeedback>
            );
        }

        const { searchable } = this.props;

        return (
            <TextInput
                ref={(ref) => { this.searchFieldRef = ref; }}
                autoFocus={searchable.autoFocus}
                onChangeText={this.onSearchTextChanged}
                onSubmitEditing={searchable.onSubmitEditing}
                placeholder={searchable.placeholder}
                style={style.titleText}
                underlineColorAndroid="transparent"
                value={this.state.searchValue}
            />
        );
    }
    renderRightElement = (style) => {
        const { rightElement, onRightElementPress, searchable } = this.props;
        const { spacing } = this.context.uiTheme;

        if (!rightElement && !searchable) {
            return null;
        }

        let actionsMap = [];
        let result = [];

        if (rightElement) {
            if (typeof rightElement === 'string') {
                actionsMap.push(rightElement);
            } else if (Array.isArray(rightElement)) {
                actionsMap = rightElement;
            } else if (rightElement.actions) {
                actionsMap = rightElement.actions;
            }
        }

        const flattenRightElement = StyleSheet.flatten(style.rightElement);

        if (actionsMap) {
            result = actionsMap.map((action, index) => {
                let content = null;

                if (React.isValidElement(action)) {
                    content = React.cloneElement(action, {
                        size: spacing.iconSize,
                        color: flattenRightElement.color,
                        style: style.rightElement,
                    });
                } else {
                    content = (
                        <Icon
                            name={action}
                            size={spacing.iconSize}
                            color={flattenRightElement.color}
                        />
                    );
                }

                return (
                    <IconToggle
                        key={index}
                        color={flattenRightElement.color}
                        onPress={() =>
                            onRightElementPress && onRightElementPress({ action, index })
                        }
                    >
                        {content}
                    </IconToggle>
                );
            });
        }

        if (React.isValidElement(rightElement)) {
            result.push(React.cloneElement(rightElement, { key: 'customRightElement' }));
        }

        if (this.state.isSearchActive && this.state.searchValue.length > 0) {
            result.push(
                <IconToggle
                    key="searchClear"
                    name="clear"
                    size={spacing.iconSize}
                    color={flattenRightElement.color}
                    style={style.rightElement}
                    onPress={() => this.onSearchTextChanged('')}
                />
            );
        }

        if (searchable && !this.state.isSearchActive) {
            result.push(
                <IconToggle
                    key="searchIcon"
                    name="search"
                    color={flattenRightElement.color}
                    onPress={this.onSearchPressed}
                    style={style.rightElement}
                />
            );
        }
        if (rightElement && rightElement.menu && !this.state.isSearchActive) {
            result.push(
                <IconToggle
                    key="menuIcon"
                    color={flattenRightElement.color}
                    onPress={() => this.onMenuPressed(rightElement.menu.labels)}
                >
                    <Icon
                        ref="menu"
                        name="more-vert"
                        size={spacing.iconSize}
                        color={flattenRightElement.color}
                        style={style.rightElement}
                    />
                </IconToggle>
            );
        }

        return (
            <View style={style.rightElementContainer}>
                {result}
            </View>
        );
    }
    render() {
        const styles = getStyles(this.props, this.context, this.state);

        return (
            <Animated.View style={styles.container}>
                {this.renderLeftElement(styles)}
                {this.renderCenterElement(styles)}
                {this.renderRightElement(styles)}
            </Animated.View>
        );
    }

}

Toolbar.propTypes = propTypes;
Toolbar.defaultProps = defaultProps;
Toolbar.contextTypes = contextTypes;

export default Toolbar;
