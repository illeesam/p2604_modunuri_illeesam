package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam2;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam2Id;
import com.shopjoy.ecadminapi.base.zz.repository.ZzExam1Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzExam2Repository;
import com.shopjoy.ecadminapi.base.zz.repository.ZzExam3Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzExam2Service {

    private final ZzExam1Repository zzExam1Repository;
    private final ZzExam2Repository zzExam2Repository;
    private final ZzExam3Repository zzExam3Repository;

    @PersistenceContext
    private EntityManager em;

    /* zz_exam2 pk */
    private ZzExam2Id pk(String exam1Id, String exam2Id) {
        return new ZzExam2Id(exam1Id, exam2Id);
    }

    /** getById — 조회 (복합 PK, 상위 exam1 / 하위 exam3s 포함) */
    public ZzExam2Dto.Item getById(String exam1Id, String exam2Id) {
        ZzExam2Dto.Item dto = zzExam2Repository.selectById(exam1Id, exam2Id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "::" + CmUtil.svcCallerInfo(this));
        fillRelations(dto);
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null) */
    public ZzExam2Dto.Item getByIdOrNull(String exam1Id, String exam2Id) {
        return zzExam2Repository.selectById(exam1Id, exam2Id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzExam2 findById(String exam1Id, String exam2Id) {
        return zzExam2Repository.findById(pk(exam1Id, exam2Id))
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String exam1Id, String exam2Id) {
        return zzExam2Repository.existsById(pk(exam1Id, exam2Id));
    }

    /** getList — 조회 (각 항목에 상위 exam1 / 하위 exam3s 포함) */
    public List<ZzExam2Dto.Item> getList(ZzExam2Dto.Request req) {
        List<ZzExam2Dto.Item> list = zzExam2Repository.selectList(req);
        list.forEach(this::fillRelations);
        return list;
    }

    /** getPageData — 조회 (각 항목에 상위 exam1 / 하위 exam3s 포함) */
    public ZzExam2Dto.PageResponse getPageData(ZzExam2Dto.Request req) {
        PageHelper.addPaging(req);
        ZzExam2Dto.PageResponse res = zzExam2Repository.selectPageList(req);
        if (res.getPageList() != null) res.getPageList().forEach(this::fillRelations);
        return res;
    }

    /** 상위 계층(exam1) + 하위 계층(exam3s) 채우기 */
    private void fillRelations(ZzExam2Dto.Item item) {
        // 상위 exam1 단건
        item.setExam1(zzExam1Repository.selectById(item.getExam1Id()).orElse(null));

        // 하위 exam3 목록 (동일 exam1Id + exam2Id)
        ZzExam3Dto.Request req3 = new ZzExam3Dto.Request();
        req3.setExam1Id(item.getExam1Id());
        req3.setExam2Id(item.getExam2Id());
        item.setExam3s(zzExam3Repository.selectList(req3));
    }

    /** create — 생성 */
    @Transactional
    public ZzExam2 create(ZzExam2 body) {
        if (body.getExam1Id() == null || body.getExam1Id().isBlank())
            throw new CmBizException("exam1Id 는 필수입니다." + "::" + CmUtil.svcCallerInfo(this));
        body.setExam2Id(CmUtil.generateId("zz_exam2"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        ZzExam2 saved = zzExam2Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** update — 수정 */
    @Transactional
    public ZzExam2 update(String exam1Id, String exam2Id, ZzExam2 body) {
        ZzExam2 entity = zzExam2Repository.findById(pk(exam1Id, exam2Id))
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "exam1Id^exam2Id^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        ZzExam2 saved = zzExam2Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzExam2 entity) {
        return zzExam2Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String exam1Id, String exam2Id) {
        ZzExam2 entity = zzExam2Repository.findById(pk(exam1Id, exam2Id))
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + exam1Id + "/" + exam2Id + "::" + CmUtil.svcCallerInfo(this)));
        zzExam2Repository.delete(entity);
        em.flush();
        if (zzExam2Repository.existsById(pk(exam1Id, exam2Id)))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzExam2> rows) {
        zzExam2Repository.saveAll(rows);
    }
}
