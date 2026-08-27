package com.shopjoy.ecadminapi.base.sy.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;

import java.util.List;
import java.util.Optional;

/** SyBbs QueryDSL Custom Repository */
public interface QSyBbsRepository {
    Optional<SyBbsDto.Item> selectById(String bbsId);
    List<SyBbsDto.Item> selectList(SyBbsDto.Request search);
    BasePage<SyBbsDto.Item> selectPageData(SyBbsDto.Request search);
    int updateSelective(SyBbs entity);

    /** 루트 bbs + 모든 자손 bbs_id 수집(트리조회 §14.6.9 — QueryDSL 전체조회 + 자바 BFS) */
    List<String> selectTreeBbsIds(String rootBbsId);
}
