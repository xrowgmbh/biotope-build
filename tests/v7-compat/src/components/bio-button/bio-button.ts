import Component, { HTMLFragment } from '@biotope/element';
import styles from './bio-button.scss';

export class BioButton extends Component {
  public static componentName = 'bio-button';

  protected styles = styles;

  public render(): HTMLFragment {
    return this.html`
      <button class="bio-button--container">
        <slot />
      </button>
    `;
  }
}
