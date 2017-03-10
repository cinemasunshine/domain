import * as monapt from 'monapt';
import * as Film from '../factory/film';
/**
 * 作品リポジトリ
 *
 * @interface FilmAdapter
 */
interface IFilmAdapter {
    /**
     * IDで検索
     *
     * @param {string} id
     */
    findById(id: string): Promise<monapt.Option<Film.IFilm>>;
    /**
     * 保管する
     *
     * @param {Film} film
     */
    store(film: Film.IFilm): Promise<void>;
}
export default IFilmAdapter;
