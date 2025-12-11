import React from 'react';
import './Footer.css';
import link02 from '../assets/kyfw_12306_bind_tel/images/link02.png';
import link03 from '../assets/kyfw_12306_bind_tel/images/link03.png';
import link04 from '../assets/kyfw_12306_bind_tel/images/link04.png';
import link05 from '../assets/kyfw_12306_bind_tel/images/link05.png';

const Footer: React.FC = () => {
  return (
    <div className="footer">
      <div className="footer-con">
        <div className="footer-links">
            <h2>友情链接</h2>
            <ul>
                <li><img src={link02} alt="Link 2" /></li>
                <li><img src={link03} alt="Link 3" /></li>
                <li><img src={link04} alt="Link 4" /></li>
                <li><img src={link05} alt="Link 5" /></li>
            </ul>
        </div>
        <div className="footer-txt">
            <p>版权所有©2008-2024 中国铁道科学研究院集团有限公司</p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
