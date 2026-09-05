package com.shopjoy.ecadminapi.md.sg.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgProjectDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgProject;

import java.util.List;
import java.util.Optional;

/** MdSgProject QueryDSL Custom Repository */
public interface QMdSgProjectRepository {

    Optional<MdSgProjectDto.Item> selectById(String projectId);

    List<MdSgProjectDto.Item> selectList(MdSgProjectDto.Request search);

    BasePage<MdSgProjectDto.Item> selectPageData(MdSgProjectDto.Request search);

    int updateSelective(MdSgProject entity);
}
