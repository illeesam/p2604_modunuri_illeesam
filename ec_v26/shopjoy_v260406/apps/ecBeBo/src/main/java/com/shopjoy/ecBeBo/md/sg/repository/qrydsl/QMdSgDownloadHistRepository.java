package com.shopjoy.ecBeBo.md.sg.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgDownloadHistDto;

import java.util.List;

/** MdSgDownloadHist QueryDSL Custom Repository */
public interface QMdSgDownloadHistRepository {

    List<MdSgDownloadHistDto.Item> selectList(MdSgDownloadHistDto.Request search);

    BasePage<MdSgDownloadHistDto.Item> selectPageData(MdSgDownloadHistDto.Request search);
}
