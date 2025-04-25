import React, { useEffect, useState } from 'react';
import {useDebounce} from 'react-use';
import Search from './component/Search' ;
import Spinner from './component/Spinner' ;
import MovieCard from './component/MovieCard';
import {updateSearchCount, getTrendingMovies} from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers:{
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}


const App = () => {
  const [debouncedSearchTerm, setdebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [movieList, setMovieList] = useState ([]);
  const [errMsg, setErrMsg] = useState(' ');
  const [isLoading, setIsLoading] = useState(false);

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendMovErrMsg, setTrendMovErrMsg] = useState('');
  const [isLoadingTrendMov, setIsLoadingTrendMov] = useState(false);

  useDebounce(()=>setdebouncedSearchTerm(searchTerm), 500, [searchTerm]);


  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrMsg('');
    try{
      const endPoint = query ?
      `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`:
      `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endPoint, API_OPTIONS)
      if(!response.ok)
      {
        throw new Error("Failed to fetch movies");
      }
      const data = await response.json();
      if(data.response === 'False')
      {
        setErrMsg(data.error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);
      if(query && data.results.length > 0)
      {
        await updateSearchCount(query, data.results[0]);
      }

    }
    catch(err)
    {
      console.error(`Error fetching movies : ${err}`);
      setErrMsg('Error fetching movies please try agin later');
    }
    finally
    {
      setIsLoading(false);
    }

  }



  const loadTrendingMovies = async() =>{
    setIsLoadingTrendMov(true);
    try{
      const trendingMovieList = await getTrendingMovies();
      setTrendingMovies(trendingMovieList);

    }catch(error)
    {
      console.log.error("Error Fetching Trending Movies");
      setErrMsg("Error in loading the trending movies")
    }
    finally{
      setIsLoadingTrendMov(false);
    }
  }

  useEffect(()=>{
    fetchMovies(debouncedSearchTerm);

  },[debouncedSearchTerm])

  useEffect(
    ()=> {loadTrendingMovies()}, []
  )
  return (
    <main>
      <div className="pattern"/>
      <div className='wrapper'>
        <header>
          <img src='./hero.png' alt='Hero Banner'/>
          <h1>Find <span className='text-gradient'>Movies</span> you'll enjoy without hastle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
        {isLoadingTrendMov ?
        (<Spinner/>) : trendMovErrMsg ? 
        (<p className='text-red'>trendMovErrMsg</p>) :(
        trendingMovies.length > 0 && (
          <section className='trending'>
          <h2>Trending Movies</h2>
          <ul>
            {trendingMovies.map((movie, index)=> (
              <li key={movie.$id}>
                <p>{index+1}</p>
                <img src={movie.posterURL} alt={movie.title}/>
              </li>))}
          </ul>
        </section>))}
        <section className='all-movies'>
          <h2>All Movies</h2>
          {
            isLoading ?(
            <Spinner/> ):
            errMsg ? (<p className='text-red'>{errMsg}</p>) :
            (<ul>
              {movieList.map((movie)=>(
               <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>)
          }
        </section>
      </div>
    </main>
  )
}

export default App