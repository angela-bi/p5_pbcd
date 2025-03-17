import { Console as ConsoleFeed, Hook, Unhook } from 'console-feed';
import { useSelector, useDispatch, Provider } from 'react-redux';
import { combineReducers, configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import React, { useEffect, useState } from 'react'


export const Console = () => {
    const [logs, setLogs] = useState([])
    
    return (
        <ConsoleFeed
            logs={logs}
        />
    )
}