package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberSnsRepository;
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
public class MbMemberSnsService {

    private final MbMemberSnsRepository mbMemberSnsRepository;

    @PersistenceContext
    private EntityManager em;

    /* SNS 연동 회원 키조회 */
    public MbMemberSnsDto.Item getById(String id) {
        MbMemberSnsDto.Item dto = mbMemberSnsRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberSnsDto.Item getByIdOrNull(String id) {
        return mbMemberSnsRepository.selectById(id).orElse(null);
    }

    /* SNS 연동 회원 상세조회 */
    public MbMemberSns findById(String id) {
        return mbMemberSnsRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberSns findByIdOrNull(String id) {
        return mbMemberSnsRepository.findById(id).orElse(null);
    }

    /* SNS 연동 회원 키검증 */
    public boolean existsById(String id) {
        return mbMemberSnsRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberSnsRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* SNS 연동 회원 목록조회 */
    public List<MbMemberSnsDto.Item> getList(MbMemberSnsDto.Request req) {
        return mbMemberSnsRepository.selectList(req);
    }

    /* SNS 연동 회원 페이지조회 */
    public MbMemberSnsDto.PageResponse getPageData(MbMemberSnsDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberSnsRepository.selectPageData(req);
    }

    /* SNS 연동 회원 등록 */
    @Transactional
    public MbMemberSns create(MbMemberSns body) {
        body.setMemberSnsId(CmUtil.generateId("mb_member_sns"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberSns saved = mbMemberSnsRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* SNS 연동 회원 수정 */
    @Transactional
    public MbMemberSns update(String id, MbMemberSns body) {
        CmUtil.requireId(id, "id", this);
        MbMemberSns entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberSnsId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberSns saved = mbMemberSnsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* SNS 연동 회원 수정 */
    @Transactional
    public MbMemberSns updateSelective(MbMemberSns entity) {
        if (entity.getMemberSnsId() == null) throw new CmBizException("memberSnsId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberSnsId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberSnsId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberSnsRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* SNS 연동 회원 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MbMemberSns entity = findById(id);
        mbMemberSnsRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbMemberSns saveOneBase(MbMemberSns entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getMemberSnsId() == null || entity.getMemberSnsId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getMemberSnsId() == null)
                throw new CmBizException("삭제 대상 memberSnsId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!mbMemberSnsRepository.existsById(entity.getMemberSnsId()))
                throw new CmBizException("존재하지 않는 MbMemberSns입니다: " + entity.getMemberSnsId() + "::" + CmUtil.svcCallerInfo(this));
            mbMemberSnsRepository.deleteById(entity.getMemberSnsId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setMemberSnsId(CmUtil.generateId("mb_member_sns"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            MbMemberSns saved = mbMemberSnsRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getMemberSnsId() == null)
                throw new CmBizException("수정 대상 memberSnsId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = mbMemberSnsRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 MbMemberSns입니다: " + entity.getMemberSnsId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getMemberSnsId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<MbMemberSns> rows) {
        /* 0단계: rowStatus 정규화 */
        for (MbMemberSns row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getMemberSnsId() == null || row.getMemberSnsId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MbMemberSns::getMemberSnsId, "U", "memberSnsId", this);
        CmUtil.requireRowIds(rows, MbMemberSns::getMemberSnsId, "D", "memberSnsId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(MbMemberSns::getMemberSnsId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbMemberSnsRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<MbMemberSns> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (MbMemberSns row : updateRows) {
            row.setUpdBy(authId);
            int affected = mbMemberSnsRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getMemberSnsId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<MbMemberSns> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbMemberSns row : insertRows) {
            row.setMemberSnsId(CmUtil.generateId("mb_member_sns"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbMemberSnsRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
