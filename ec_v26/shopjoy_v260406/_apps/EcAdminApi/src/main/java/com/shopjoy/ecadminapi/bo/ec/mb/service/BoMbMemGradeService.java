package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 회원등급 서비스 — base MbMemberGradeService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoMbMemGradeService {

    private final MbMemberGradeService mbMemberGradeService;

    public MbMemberGradeDto.Item getById(String id) { return mbMemberGradeService.getById(id); }
    public List<MbMemberGradeDto.Item> getList(MbMemberGradeDto.Request req) { return mbMemberGradeService.getList(req); }
    public MbMemberGradeDto.PageResponse getPageData(MbMemberGradeDto.Request req) { return mbMemberGradeService.getPageData(req); }

    @Transactional public MbMemberGrade create(MbMemberGrade body) {
        if (body.getUseYn() == null) body.setUseYn("Y");
        return mbMemberGradeService.create(body);
    }
    @Transactional public MbMemberGrade update(String id, MbMemberGrade body) { return mbMemberGradeService.update(id, body); }
    @Transactional public void delete(String id) { mbMemberGradeService.delete(id); }
    @Transactional public List<MbMemberGrade> saveList(List<MbMemberGrade> rows) { return mbMemberGradeService.saveList(rows); }
}
