import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router-dom'
import { Navigation, Search } from './index'
import { Intro, Contact } from '../../components'
import { useDispatch, useSelector } from 'react-redux'


const Home = () => {
    const { isLoggedIn } = useSelector(state => state.auth)

    return (
        <div className='w-full flex gap-6 flex-col items-center min-h-screen'>
            <Header />
            <Navigation />
            {isLoggedIn && <Search />}
            <div className='w-full max-w-6xl px-3 sm:px-5 flex flex-col items-start justify-start mt-3'>
                <Outlet />
            </div>
            <Intro />
            <Contact />
        </div>
    )
}

export default Home