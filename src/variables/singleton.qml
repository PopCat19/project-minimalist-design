pragma Singleton
import QtQuick 2.15

QtObject {
    readonly property real rem: 16
    readonly property real scale2: 0.125 * rem
    readonly property real scale4: 0.25 * rem
    readonly property real scale8: 0.5 * rem
    readonly property real scale12: 0.75 * rem
    readonly property real scale16: 1.0 * rem
    readonly property real scale24: 1.5 * rem
    readonly property real scale32: 2.0 * rem
    readonly property real scale48: 3.0 * rem

    readonly property real radiusSmall: 0.5 * rem
    readonly property real radiusMedium: 1.0 * rem
    readonly property real radiusLarge: 2.0 * rem
    readonly property real radiusFull: 9999

    readonly property real borderDefault: 0.125 * rem
    readonly property real borderThick: 0.25 * rem

    readonly property real opacity8: 0.08
    readonly property real opacity12: 0.12
    readonly property real opacity24: 0.24
    readonly property real opacity32: 0.32
    readonly property real opacity40: 0.40
    readonly property real opacity64: 0.64
    readonly property real opacity80: 0.80

    readonly property real backdropBlur: 24

    property color color100x: "#FFFFFF"
    property color color88x: "#FFC2D1"
    property color color88xAux: "#C2FFF0"
    property color color80x: "#FF99B2"
    property color color64x: "#FF4775"
    property color color8x: "#1E0B10"
    property color color0x: "#000000"
}
