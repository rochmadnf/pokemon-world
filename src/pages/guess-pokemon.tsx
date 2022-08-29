import { GetStaticPropsResult } from 'next';
import { NextSeo } from 'next-seo';
import { useCallback, useEffect, useState } from 'react';
import { useFirstMount, useLocalStorage } from 'react-power-ups';
import { dehydrate, DehydratedState } from 'react-query';

import PokemonImage from '@/components/commons/pokemon-image';
import getQueryClient from '@/config/react-query';
import GuessPokemonForm, {
  GuessPokemonState,
} from '@/features/guess-pokemon/components/guess-pokemon-form';
import { LEVELS, ROTATION_CLASSNAME } from '@/features/guess-pokemon/constants';
import { getRandomBetween } from '@/utils/number';
import pokemonNamesJSON from '~/generated/pokemons.json';
import pokemonIds from '~/generated/pokemons-ids.json';

type Result = GetStaticPropsResult<{ dehydratedState: DehydratedState }>;

export async function getStaticProps(): Promise<Result> {
  const queryClient = getQueryClient();
  await queryClient.fetchQuery(['pokemon-names'], () => pokemonNamesJSON);

  // https://github.com/tannerlinsley/react-query/issues/1458
  const dehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

  return {
    props: {
      dehydratedState,
    },
  };
}

const LAST_POKEMON_INDEX = pokemonIds.length - 1;

export default function GuessPokemonPage() {
  const [level, setLevel] = useState(2);

  const [state, setState] = useState<GuessPokemonState>({
    currentPokemonIndex: 0,
    imgClassName: '',
    answerState: '',
  });
  const { currentPokemonIndex, imgClassName } = state;
  const currentPokemonId = pokemonIds[currentPokemonIndex];

  const startGame = useCallback(() => {
    const newState = {
      answerState: 'void',
      currentPokemonIndex: getRandomBetween(0, LAST_POKEMON_INDEX),
    };

    if (level === 1) return setState({ ...newState, imgClassName: 'grayscale' });

    if (level === 2)
      return setState({ ...newState, imgClassName: 'brightness-0 opacity-70 dark:invert' });

    const classNames = [
      'brightness-0 opacity-70 dark:invert',
      ROTATION_CLASSNAME[getRandomBetween(0, 6)],
      Math.random() < 0.5 ? '' : 'scale-x-[-1]',
    ];
    return setState({ ...newState, imgClassName: classNames.join(' ') });
  }, [level]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const isFirstRender = useFirstMount();

  const [score, setScore] = useLocalStorage({
    key: 'score',
    initialValue: 0,
    validator: (data) => typeof data === 'number',
  });

  return (
    <>
      <NextSeo
        title="Who's That Pokémon?"
        description="Prove that you are truly a Pokemon lover! Guess as many Pokemon as you can and claim the highest score."
      />

      <h1 className="h1 pb-6">Who&apos;s That Pokémon?</h1>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pb-6">
        <div className="font-medium">Difficulty:</div>
        <div className="flex gap-4">
          {LEVELS.map(({ id, name }) => (
            <label key={id} htmlFor={`_form:level${id}`}>
              <input
                type="radio"
                name="level"
                id={`_form:level${id}`}
                value={id}
                checked={level === id}
                onChange={() => setLevel(id)}
                className="mr-1.5"
              />
              {name}
            </label>
          ))}
        </div>
      </div>

      <div className="pokemon-card inline-block text-lg text-typography-light dark:text-typography-dark">
        Your Score: <b>{score}</b>
      </div>

      <div className="-mx-3.5">
        <div className="pointer-events-none max-w-full overflow-hidden p-10">
          {!isFirstRender && (
            <PokemonImage
              size={400}
              idPokemon={currentPokemonId}
              className={imgClassName}
              imgClassName={imgClassName}
              onError={startGame}
              alt=" "
            />
          )}
        </div>
      </div>

      <GuessPokemonForm
        level={level}
        state={state}
        setState={setState}
        startGame={startGame}
        setScore={setScore}
      />
    </>
  );
}
