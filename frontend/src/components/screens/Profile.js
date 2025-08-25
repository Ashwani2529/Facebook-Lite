import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import PopUpDailoge from './PopUpDailoge';
import Profilecards from './Profilecards';
import { IconButton } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import imageCompression from "browser-image-compression";
import { toast } from 'react-toastify';
import { UserContext } from '../../App';
import { InputGroup, FormControl } from "react-bootstrap";
import SERVER_URL from '../../server_url';
import { generateAvatarPlaceholder } from '../../utils/avatarUtils';
const Profile = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [mypics, setPics] = useState([])
  const { state, dispatch } = useContext(UserContext);


  const [img, setImg] = useState({
    compressedLink: "",
  })




  useEffect(() => {

    fetch(`${SERVER_URL}/api/v1/posts/mypost`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('jwt')
      }
    }).then(res => res.json())
      .then(result => setPics(result.posts || []))
  }, [])


  const togglePopus = () => {
    setIsOpen(!isOpen);
  }


  const selectImage = e => {
    const imageFile = e.target.files[0];
    console.log(imageFile.size / 1024 / 1024);
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 200,
      useWebWorker: true
    };


    if (imageFile.size / 1024 / 1024 <= 10) {
      imageCompression(imageFile, options).then(x => {
        console.log(x.size / 1024 / 1024);
        setImg({
          compressedLink: URL.createObjectURL(x),
          compressedBlob: x,
        });
      })
    } else {
      toast.error('Select Image upto 10 Mb', { position: toast.POSITION.TOP_RIGHT });
      return 0;
    }

  };

  const updateData = () => {

    if (img.compressedBlob) {
      console.log(img.compressedBlob)
      const data = new FormData()
      data.append("file", img.compressedBlob)
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dtrsgpw04";
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "Cloudy";

      data.append("upload_preset", uploadPreset);
      data.append("cloud_name", cloudName);

      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "post",
        body: data
      }).then(res => res.json()).then((data) => {
        console.log("in thennn")
        localStorage.setItem("user", JSON.stringify({ ...state, pic: data.url }))
        dispatch({ type: "UPDATEPIC", payload: data.url })

        fetch(`${SERVER_URL}/api/v1/users/updatepic`, {
          method: "put",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("jwt")
          },
          body: JSON.stringify({
            pic: data.url
          })
        }).then(res => res.json()).then(result => console.log(result))

      }).catch(err => console.log(err));
    }
  }




  return (
    <>
      <Navbar />
      <div className='container-fluid'>
        <div className='row'>


          <div className='col-md-4 picture'>
            <img
              height='300px'
              width='300px'
              src={state?.pic || generateAvatarPlaceholder(state?.name || 'User', 300)}
              alt='Profile Picture'
              style={{ borderRadius: '15px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = generateAvatarPlaceholder(state?.name || 'User', 300);
              }}
            />
          </div>

          <div className='col-md-8 d-block'>

            <div className='d-flex'>
              <h3 className='m-4 text-gray-900 dark:text-white'>{state ? state.name : "wait.."}</h3>

              {isOpen && <PopUpDailoge
                togglePopus={togglePopus} content={<>

                  <div className='text-center popupitems'>

                    {
                      img.compressedLink ? (
                        <img src={img.compressedLink} alt='imgaeHere' height="200px" width="200px" id='openImage' />
                      ) : (
                        <img src={state.pic} alt='imgaeHere' height="200px" width="200px" id='openImage' />
                      )

                    }


                    <input accept="image/*" id="icon-button-file"
                      type="file" style={{ display: 'none' }}
                      onChange={e => selectImage(e)}
                    />
                    <label htmlFor="icon-button-file">
                      <IconButton color="primary" aria-label="upload picture"
                        component="span">
                        <PhotoCameraIcon className='btn-outline-light' style={{ fontSize: 40 }} />
                      </IconButton>
                    </label>

                  </div>
                  <div className='row'>
                    <InputGroup className="p-3" size='lg'>
                      <FormControl
                        aria-label="Example text with button addon"
                        aria-describedby="basic-addon1"
                        placeholder='Password'

                        onFocus={(e) => (e.target.placeholder = '')}
                        onBlur={(e) => e.target.placeholder = 'Password'}
                        onChange={(e) => {

                        }}
                      />

                    </InputGroup>

                  </div>




                  <br className='text-dark'></br>

                  <div className='row' id='accbtn'>
                    <button className='btn btn-warning' onClick={() => {
                      updateData()
                      togglePopus()

                    }}>Save</button>
                  </div>
                </>}

              />}
            </div>

            <div className='d-block justify-content-between align-items-center'>
              <div className='d-flex justify-content-evenly'>
                <p className='my-3 p-2 text-gray-900 dark:text-white'><strong>{mypics ? mypics.length : "wait.."}</strong> Posts</p>
                <p className='my-3 p-2 text-gray-900 dark:text-white'><strong>{state ? state.followers.length : "0"}</strong> Followers</p>
                <p className='my-3 p-2 text-gray-900 dark:text-white'><strong>{state ? state.following.length : "0"}</strong> Followings</p>
              </div>
            </div>

            <div>
              <p className='m-3 text-gray-900 dark:text-white'>{state?.bio || 'No bio available'}</p>

            </div>

          </div>
          <div className='border-light border-bottom my-4'></div>
        </div>
        <div className='row'>
          {

            mypics.map((item) => {

              return <Profilecards url={item.photo} body={item.body} />;

            })
          }
        </div>

      </div>
    </>
  )
}

export default Profile;