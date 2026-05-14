package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample2Repository;
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

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSample2Service {

    private final ZzSample2Repository zzSample2Repository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 조회 */
    public ZzSample2Dto.Item getById(String id) {
        ZzSample2Dto.Item dto = zzSample2Repository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample2Dto.Item getByIdOrNull(String id) {
        return zzSample2Repository.selectById(id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public ZzSample2 findById(String id) {
        return zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public ZzSample2 findByIdOrNull(String id) {
        return zzSample2Repository.findById(id).orElse(null);
    }

    /** existsById — 존재 확인 */
    public boolean existsById(String id) {
        return zzSample2Repository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!zzSample2Repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 조회 */
    public List<ZzSample2Dto.Item> getList(ZzSample2Dto.Request req) {
        return zzSample2Repository.selectList(req);
    }

    /** getPageData — 조회 */
    public ZzSample2Dto.PageResponse getPageData(ZzSample2Dto.Request req) {
        PageHelper.addPaging(req);
        return zzSample2Repository.selectPageList(req);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample2 create(ZzSample2 body) {
        body.setSample2Id(CmUtil.generateId("zz_sample2"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        ZzSample2 saved = zzSample2Repository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** save — 저장 (단건) */
    @Transactional
    public ZzSample2 save(ZzSample2 entity) {
        if (entity.getSample2Id() == null || !zzSample2Repository.existsById(entity.getSample2Id()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSample2Id() + "::" + CmUtil.svcCallerInfo(this));
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSample2Repository.save(entity);
    }

    /** update — 수정 */
    @Transactional
    public ZzSample2 update(String id, ZzSample2 body) {
        ZzSample2 entity = zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        VoUtil.voCopyExclude(body, entity, "sample2Id^rgtr^regDt");
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        ZzSample2 saved = zzSample2Repository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 부분 수정 (selective) */
    @Transactional
    public int updateSelective(ZzSample2 entity) {
        return zzSample2Repository.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        ZzSample2 entity = zzSample2Repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        zzSample2Repository.delete(entity);
        em.flush();
        if (zzSample2Repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<ZzSample2> rows) {
        zzSample2Repository.saveAll(rows);
    }
}
