package com.shopjoy.ecadminapi.md.sg.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgDownloadHistDto;

import java.util.List;

/** MdSgDownloadHist QueryDSL Custom Repository */
public interface QMdSgDownloadHistRepository {

    List<MdSgDownloadHistDto.Item> selectList(MdSgDownloadHistDto.Request search);

    BasePage<MdSgDownloadHistDto.Item> selectPageData(MdSgDownloadHistDto.Request search);
}
