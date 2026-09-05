'use client';
import { useState } from 'react';
import { Check, ArrowRight, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { allSkills, hobbyOptions } from '@/lib/profile-details';
import type { ResidentProfile } from '@/lib/profile';
import type { Run } from '@/lib/presentation';

export function ProfileDetails({
  profile,
  run,
  disabled,
  onSaved,
}: {
  profile: ResidentProfile;
  run: Run;
  disabled: boolean;
  onSaved?: () => void;
}) {
  const [about, setAbout] = useState(profile.about ?? '');
  const [skills, setSkills] = useState((profile.selfSkills ?? []).join(', '));
  const [expertise, setExpertise] = useState(
    (profile.expertise ?? []).join(', '),
  );
  const [hobbies, setHobbies] = useState(profile.hobbies ?? []);
  const [customHobbies, setCustomHobbies] = useState('');
  const [saved, setSaved] = useState(false);
  const tags = (value: string) =>
    value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  return (
    <form
      className="details-form"
      onChange={() => setSaved(false)}
      onSubmit={async (event) => {
        event.preventDefault();
        if (
          await run('profileUpdate', {
            about,
            selfSkills: tags(skills),
            expertise: tags(expertise),
            hobbies: [...new Set([...hobbies, ...tags(customHobbies)])],
          })
        ) {
          setHobbies([...new Set([...hobbies, ...tags(customHobbies)])]);
          setCustomHobbies('');
          setSaved(true);
          onSaved?.();
        }
      }}
    >
      <label>
        Introduce yourself
        <textarea
          rows={3}
          maxLength={1200}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="What would you love to share with your neighbours?"
        />
      </label>
      {!!allSkills(profile).length && (
        <div>
          <span className="town-label">Skills already in your profile</span>
          <div className="skill-chips">
            {allSkills(profile).map((skill) => (
              <span key={skill}>
                <Sprout size={14} />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      <label>
        Other skills
        <input
          maxLength={1800}
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="e.g. Baking, first aid, Excel"
        />
        <small>
          Separate skills with commas. Imported skills stay linked to their
          source.
        </small>
      </label>
      <label>
        Experience & expertise
        <input
          maxLength={1800}
          value={expertise}
          onChange={(e) => setExpertise(e.target.value)}
          placeholder="e.g. Workshop facilitation, event planning"
        />
        <small>
          Areas where you feel comfortable helping or mentoring others.
        </small>
      </label>
      <fieldset>
        <legend>Hobbies & interests</legend>
        <p className="quiet-copy">
          These help us suggest gatherings you might enjoy.
        </p>
        <div className="interest-options">
          {[...new Set([...hobbyOptions, ...hobbies])].map((hobby, i) => (
            <label
              key={hobby}
              className={hobbies.includes(hobby) ? 'chosen' : ''}
            >
              <Checkbox
                id={'hobby-' + i}
                checked={hobbies.includes(hobby)}
                disabled={disabled}
                onCheckedChange={(checked) => {
                  setSaved(false);
                  setHobbies((current) =>
                    checked
                      ? [...current, hobby]
                      : current.filter((item) => item !== hobby),
                  );
                }}
              />
              {hobby}
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Something else you enjoy
        <input
          maxLength={300}
          value={customHobbies}
          onChange={(e) => setCustomHobbies(e.target.value)}
          placeholder="Add your own interests, separated by commas"
        />
      </label>
      <div className="form-actions">
        <Button className="primary-button" disabled={disabled} type="submit">
          {onSaved ? 'Save & continue' : 'Save profile'}
          {onSaved ? <ArrowRight size={16} /> : <Check size={16} />}
        </Button>
        {saved && <output>Profile saved</output>}
      </div>
    </form>
  );
}
