#!/bin/bash
set -e

REPO="arnif/kronan-cli"
BINARY_NAME="kronan"
DEFAULT_INSTALL_DIR="${HOME}/.local/bin"

check_gh_cli() {
    if ! command -v gh >/dev/null 2>&1; then
        echo "Error: GitHub CLI (gh) is not installed."
        echo ""
        echo "Install gh CLI first:"
        echo "  macOS:  brew install gh"
        echo "  Linux:  https://github.com/cli/cli#installation"
        echo ""
        echo "Then authenticate: gh auth login"
        exit 1
    fi

    if ! gh auth status >/dev/null 2>&1; then
        echo "Error: GitHub CLI is not authenticated."
        echo ""
        echo "Run: gh auth login"
        exit 1
    fi
}

detect_platform() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case "$OS" in
        linux)  OS="linux" ;;
        darwin) OS="darwin" ;;
        *)
            echo "Unsupported OS: $OS"
            exit 1
            ;;
    esac

    case "$ARCH" in
        x86_64)         ARCH="x64" ;;
        aarch64|arm64)  ARCH="arm64" ;;
        *)
            echo "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac

    PLATFORM="${OS}-${ARCH}"
}

get_latest_release() {
    echo "Fetching latest release..."
    VERSION=$(gh release view --repo "$REPO" --json tagName --jq '.tagName' 2>/dev/null)

    if [ -z "$VERSION" ]; then
        echo "Failed to get latest version."
        echo ""
        echo "Make sure you have access to: $REPO"
        exit 1
    fi

    echo "Latest version: $VERSION"
}

download_binary() {
    ASSET_NAME="kronan-${PLATFORM}"
    TMP_FILE=$(mktemp)

    echo "Downloading ${ASSET_NAME}..."

    if ! gh release download "$VERSION" \
        --repo "$REPO" \
        --pattern "$ASSET_NAME" \
        --output "$TMP_FILE" \
        --clobber; then
        echo "Failed to download binary."
        echo ""
        echo "Available assets:"
        gh release view "$VERSION" --repo "$REPO" --json assets --jq '.assets[].name' 2>/dev/null || true
        rm -f "$TMP_FILE"
        exit 1
    fi

    DOWNLOADED="$TMP_FILE"
}

install_binary() {
    INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"

    if [ ! -d "$INSTALL_DIR" ]; then
        echo "Creating directory: $INSTALL_DIR"
        mkdir -p "$INSTALL_DIR"
    fi

    chmod +x "$DOWNLOADED"
    mv "$DOWNLOADED" "${INSTALL_DIR}/${BINARY_NAME}"

    echo "Installed to ${INSTALL_DIR}/${BINARY_NAME}"
}

verify_installation() {
    if command -v "$BINARY_NAME" >/dev/null 2>&1; then
        echo ""
        echo "kronan-cli installed successfully!"
        echo ""
        echo "Location: ${INSTALL_DIR}/${BINARY_NAME}"
        echo ""
        echo "Get started:"
        echo "  kronan login <phone>     Login via Rafraen skilriki"
        echo "  kronan search \"mjolk\"    Search for products"
        echo "  kronan cart              View your cart"
        echo "  kronan help              Show all commands"
        echo ""
    else
        echo ""
        echo "Installation complete, but '${BINARY_NAME}' not found in PATH."
        echo "Add this to your shell profile:"
        echo ""
        echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
        echo ""
    fi
}

main() {
    echo "Installing kronan-cli..."
    echo ""

    check_gh_cli
    detect_platform
    get_latest_release
    download_binary
    install_binary
    verify_installation
}

main
