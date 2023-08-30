import React from 'react';





const Profilecards = (props) => {
  return(
    
        <div className='col-md-2 m-3 ' style={{width:'320px', height:'100%', borderRadius:'10px',backgroundColor:'#23395b'}}>
            <div className='text-center'>
            <img src={props.url} alt='thisImage' className='my-3' width='250px' height='250px'/>
            </div>
            
            <p style={{textAlign:'center'}} className='paragraph'>{props.body}</p>
        </div> 
  )
}

export default Profilecards;