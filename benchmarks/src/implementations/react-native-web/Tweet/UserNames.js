import AppText from "./AppText";
import { StyleSheet } from "react-native";
import React, { PureComponent } from "react";

class UserNames extends PureComponent {
  static displayName = "UserNames";

  static defaultProps = {
    layout: "nowrap"
  };

  render() {
    const {
      fullName,
      layout,
      onPress,
      screenName,
      style,
      ...other
    } = this.props;

    return (
      <AppText
        {...other}
        color="deepGray"
        numberOfLines={layout === "nowrap" ? 1 : null}
        onPress={onPress}
        style={[styles.root, style]}
      >
        <AppText color="normal" weight="bold">
          {fullName}
        </AppText>
        {layout === "stack" ? " \u000A" : " "}
        <AppText
          color="deepGray"
          style={styles.screenName}
        >{`@${screenName}`}</AppText>
      </AppText>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    display: "inline-block"
  },
  screenName: {
    unicodeBidi: "embed",
    writingDirection: "ltr"
  }
});

export default UserNames;
