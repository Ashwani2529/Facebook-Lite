import React from 'react';
import { Link } from 'react-router-dom'
import PersonOutlineSharpIcon from '@material-ui/icons/PersonOutlineSharp';

const Navbar = () => {
  return(
    <>
      <nav className='navbar navbar-expand-lg navbar-transparent' style={{backgroundColor:'teal'}}>
        <Link to='/' className="navbar-brand anchor text-light m-2">Facebook Lite</Link>
        <Link to='/login' className="navbar-brand d-flex p-2 text-light">Login <PersonOutlineSharpIcon style={{marginTop:'3px'}} /></Link>
      </nav>
    </>
  )
}


export default Navbar;