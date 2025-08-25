import React,{useContext} from 'react';
import { Link, useNavigate } from 'react-router-dom'
import PersonOutlineSharpIcon from '@mui/icons-material/PersonOutlineSharp';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import {UserContext} from '../../App'
import 'bootstrap/dist/css/bootstrap.min.css';
import {Navbar, Container , Nav} from "react-bootstrap";


const Homenav = () => {
  // eslint-disable-next-line
  const {state,dispatch} = useContext(UserContext)
  const navigate = useNavigate();
  return(
    <>
    <Navbar collapseOnSelect expand="lg" variant="dark" style={{backgroundColor:'#23395b'}}>
      <Container className='text-center'>
        <Navbar.Brand><Link to='/' className="navbar-brand anchor text-warning no-underline">Facebook Lite 🔥</Link></Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-end"> 
        
          
          
          

        <Nav className=''>
            <Nav.Link href="#deets"><Link to='/' className="navbar-brand d-flex p-2 text-warning " style={{fontFamily:'"Roboto", sans-serif'}}> Explore <LibraryBooksIcon style={{marginTop:'3px',marginLeft:'2px'}} /></Link></Nav.Link>
            <Nav.Link eventKey={2} href="#memes"><Link to='/subscribedposts' className="navbar-brand d-flex p-2 text-warning " style={{fontFamily:'"Roboto", sans-serif'}}> Home <HomeOutlinedIcon style={{marginTop:'3px',marginLeft:'2px'}} /></Link></Nav.Link>
            <Nav.Link eventKey={2} href="#memes"><Link to='/profile' className="navbar-brand d-flex p-2 text-warning " style={{fontFamily:'"Roboto", sans-serif'}}>Profile<PersonOutlineSharpIcon style={{marginTop:'3px',marginLeft:'2px'}} /></Link></Nav.Link>
            <Nav.Link eventKey={2} href="#memes"><Link  onClick={()=>{
                localStorage.clear()
                dispatch({type:"CLEAR"})
                navigate('/login')
              }} className="navbar-brand d-flex p-2 text-warning " style={{fontFamily:'"Roboto", sans-serif'}}>Logout<ExitToAppOutlinedIcon style={{marginTop:'3px',marginLeft:'2px'}} /></Link></Nav.Link>
        </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
      
    </>
  )
}


export default Homenav;