let ioInstance = null;
export const setSocketIO = (io) => {
    ioInstance = io;
};
export const getSocketIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.IO not initialized');
    }
    return ioInstance;
};
//# sourceMappingURL=socket.js.map