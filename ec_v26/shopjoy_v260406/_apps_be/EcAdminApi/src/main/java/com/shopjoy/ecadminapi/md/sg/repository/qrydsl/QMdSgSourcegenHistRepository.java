package com.shopjoy.ecadminapi.md.sg.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgSourcegenHistDto;

import java.util.List;

/** MdSgSourcegenHist QueryDSL Custom Repository — 소스젠 경계를 넘는 생성이력 조회용 */
public interface QMdSgSourcegenHistRepository {

    List<MdSgSourcegenHistDto.Item> selectList(MdSgSourcegenHistDto.Request search);

    BasePage<MdSgSourcegenHistDto.Item> selectPageData(MdSgSourcegenHistDto.Request search);
}
